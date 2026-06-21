/* ============================================================
   app.js — UI logic: camera / upload / realtime / result / history
   ============================================================ */
(() => {
  const $ = (s) => document.querySelector(s);
  const state = {
    lang: localStorage.getItem("mid_lang") || "th",
    mode: "cam",            // 'cam' | 'up'
    live: false,
    stream: null,
    facing: "environment",
    thresh: +(localStorage.getItem("mid_thresh") || 40),
    interval: +(localStorage.getItem("mid_interval") || 800),
    liveTimer: null,
    busy: false
  };

  /* ---------------- i18n ---------------- */
  const I18N = {
    th: { cam:"กล้องสด", upload:"เลือกรูป", capture:"สแกนภาพนี้", live:"เรียลไทม์", pick:"เลือกจากคลัง",
      rescan:"สแกนใหม่", dropHint:"ลากรูปมาวาง · กดเลือกจากคลัง · หรือวาง (Ctrl+V)",
      permErr:"⚠️ เปิดกล้องไม่ได้ — อนุญาตสิทธิ์กล้อง หรือเปิดผ่าน https/localhost แล้วลองใหม่",
      await:"รอผลการสแกน…", awaitSub:"เปิดกล้องหรือเลือกรูปเพื่อระบุพันธุ์",
      breakdown:"ความน่าจะเป็นแต่ละพันธุ์", history:"ประวัติการสแกน", clear:"ล้าง",
      settings:"ตั้งค่า", thresh:"เกณฑ์ความมั่นใจขั้นต่ำ", interval:"ความถี่ทำนายเรียลไทม์",
      match:"ความมั่นใจ", lowConf:"ความมั่นใจต่ำ — ลองเข้าใกล้/จัดแสงใหม่",
      navScan:"สแกน", navEncy:"คู่มือพันธุ์ไม้",
      encyTitle:"คู่มือพันธุ์ไม้", encySub:"คุณลักษณะเด่นของแต่ละพันธุ์ที่ระบบจำแนกได้ 5 ชนิด",
      heroTitle:"ระบบ AI จำแนกพันธุ์ไม้", heroSub:"เปิดกล้องหรือเลือกรูป แล้วให้ AI ระบุพันธุ์ทันที",
      stSpecies:"พันธุ์", stImgs:"ภาพฝึกสอน", stLang:"ภาษา",
      share:"แชร์ผล", save:"บันทึกรูป", sound:"เสียง + สั่นตอนสแกนสำเร็จ",
      navDash:"แดชบอร์ด", dashTitle:"แดชบอร์ดสถิติการสแกน", dashSub:"สรุปผลการจำแนกที่สแกนสะสมในเครื่องนี้",
      dashEmpty:"ยังไม่มีข้อมูล — ลองสแกนดูก่อน", kpiTotal:"สแกนทั้งหมด", kpiTop:"พบบ่อยสุด",
      kpiAvg:"ความมั่นใจเฉลี่ย", kpiSpecies:"พันธุ์ที่พบ", dashDist:"การกระจายตามพันธุ์" },
    en: { cam:"Live Camera", upload:"Upload", capture:"Scan this frame", live:"Realtime", pick:"Pick from gallery",
      rescan:"Scan again", dropHint:"Drag an image · pick from gallery · or paste (Ctrl+V)",
      permErr:"⚠️ Cannot open camera — allow camera permission or open via https/localhost and retry",
      await:"Awaiting scan…", awaitSub:"Open the camera or choose an image to identify",
      breakdown:"Per-species probability", history:"Scan history", clear:"Clear",
      settings:"Settings", thresh:"Minimum confidence", interval:"Realtime frequency",
      match:"match", lowConf:"Low confidence — move closer / improve lighting",
      navScan:"Scan", navEncy:"Field Guide",
      encyTitle:"Plant Field Guide", encySub:"Key characteristics of the 5 species the model can classify",
      heroTitle:"AI Plant Species Identifier", heroSub:"Open the camera or pick a photo — AI identifies the species instantly",
      stSpecies:"species", stImgs:"train images", stLang:"languages",
      share:"Share", save:"Save image", sound:"Sound + haptics on success",
      navDash:"Dashboard", dashTitle:"Scan Statistics Dashboard", dashSub:"Summary of classifications scanned on this device",
      dashEmpty:"No data yet — try scanning first", kpiTotal:"Total scans", kpiTop:"Most found",
      kpiAvg:"Avg. confidence", kpiSpecies:"Species found", dashDist:"Distribution by species" }
  };
  const t = (k) => (I18N[state.lang][k] ?? k);
  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    $("#langBtn").textContent = state.lang.toUpperCase();
    document.documentElement.lang = state.lang;
  }

  /* ---------------- elements ---------------- */
  const video = $("#video"), preview = $("#preview"), badge = $("#modelBadge");
  const liveTag = $("#liveTag");

  /* ---------------- splash boot ---------------- */
  const splash = $("#splash"), splashBar = $("#splashBar"), splashStatus = $("#splashStatus");
  let _sp = 0; const _spTimer = setInterval(() => { _sp = Math.min(90, _sp + Math.random() * 16); if (splashBar) splashBar.style.width = _sp + "%"; }, 180);
  function finishSplash(msg) {
    clearInterval(_spTimer);
    if (splashBar) splashBar.style.width = "100%";
    if (splashStatus) splashStatus.textContent = msg;
    setTimeout(() => { if (splash) splash.classList.add("hide"); runCounters(); }, 650);
  }

  /* ---------------- model init ---------------- */
  MangroveModel.init().then(r => {
    if (r.demo) {
      badge.className = "badge badge-demo"; badge.textContent = "◈ DEMO";
      badge.title = "ยังไม่พบ model/best.onnx — กำลังใช้ผลสาธิต";
      $("#modelNote").innerHTML = "โหมดสาธิต: วางไฟล์ <code>best.onnx</code> ในโฟลเดอร์ <code>model/</code> เพื่อใช้โมเดลจริง";
      finishSplash(state.lang === "th" ? "พร้อมใช้งาน · โหมดสาธิต" : "Ready · demo mode");
    } else {
      badge.className = "badge badge-ok"; badge.textContent = "● MODEL READY";
      $("#modelNote").textContent = "โหลดโมเดลจริงสำเร็จ ✓";
      finishSplash(state.lang === "th" ? "พร้อมใช้งาน · โมเดลพร้อม" : "Ready · model loaded");
    }
  });

  /* ---------------- tabs ---------------- */
  function setMode(m) {
    state.mode = m;
    $("#tabCam").classList.toggle("is-active", m === "cam");
    $("#tabUp").classList.toggle("is-active", m === "up");
    $("#camControls").hidden = m !== "cam";
    $("#upControls").hidden = m !== "up";
    video.hidden = m !== "cam";
    $("#dropHint").hidden = !(m === "up" && preview.hidden);
    $(".scanline").style.display = m === "cam" ? "" : "none";
    if (m === "cam") { preview.hidden = true; startCamera(); }
    else { stopLive(); stopCamera(); }
  }
  $("#tabCam").onclick = () => setMode("cam");
  $("#tabUp").onclick = () => setMode("up");

  /* ---------------- camera ---------------- */
  async function startCamera() {
    stopCamera();
    $("#permErr").hidden = true;
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false
      });
      video.srcObject = state.stream;
      await video.play().catch(() => {});
    } catch (e) {
      $("#permErr").hidden = false;
      console.warn("camera error", e);
    }
  }
  function stopCamera() {
    if (state.stream) { state.stream.getTracks().forEach(tr => tr.stop()); state.stream = null; }
  }
  $("#flipBtn").onclick = () => { state.facing = state.facing === "environment" ? "user" : "environment"; startCamera(); };

  /* ---------------- realtime ---------------- */
  function startLive() {
    if (state.live) return;
    state.live = true; liveTag.hidden = false;
    $("#liveBtn").classList.add("armed");
    $("#viewport").classList.add("scanning");
    const loop = async () => {
      if (!state.live) return;
      if (!state.busy && video.readyState >= 2) {
        state.busy = true;
        try {
          const res = await MangroveModel.predict(video);
          const info = speciesInfo(res.top.key, state.lang);
          $("#liveName").textContent = info ? info.name : res.top.key;
          $("#liveConf").textContent = Math.round(res.top.p * 100) + "%";
        } catch (e) { /* ignore */ }
        state.busy = false;
      }
      state.liveTimer = setTimeout(loop, state.interval);
    };
    loop();
  }
  function stopLive() {
    state.live = false; liveTag.hidden = true;
    $("#liveBtn").classList.remove("armed");
    $("#viewport").classList.remove("scanning");
    clearTimeout(state.liveTimer);
  }
  $("#liveBtn").onclick = () => state.live ? stopLive() : startLive();

  /* ---------------- capture / scan ---------------- */
  $("#shotBtn").onclick = async () => {
    if (video.readyState < 2) return;
    await runPrediction(video);
  };

  /* ---------------- upload ---------------- */
  $("#pickBtn").onclick = () => $("#fileInput").click();
  $("#fileInput").onchange = (e) => { if (e.target.files[0]) loadFile(e.target.files[0]); };
  $("#rescanBtn").onclick = () => { if (preview.src) runPrediction(preview); };

  function loadFile(file) {
    const url = URL.createObjectURL(file);
    preview.onload = async () => {
      preview.hidden = false; $("#dropHint").hidden = true; $("#rescanBtn").hidden = false;
      await runPrediction(preview);
      URL.revokeObjectURL(url);
    };
    preview.src = url;
  }
  // drag & drop
  const vp = $("#viewport");
  ["dragenter", "dragover"].forEach(ev => vp.addEventListener(ev, e => {
    if (state.mode === "up") { e.preventDefault(); $("#dropHint").classList.add("drag"); $("#dropHint").hidden = false; }
  }));
  ["dragleave", "drop"].forEach(ev => vp.addEventListener(ev, e => {
    e.preventDefault(); $("#dropHint").classList.remove("drag");
    if (!preview.src) $("#dropHint").hidden = state.mode !== "up";
  }));
  vp.addEventListener("drop", e => {
    const f = e.dataTransfer.files[0]; if (f && f.type.startsWith("image/")) { setMode("up"); loadFile(f); }
  });
  // paste
  window.addEventListener("paste", e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
    if (item) { setMode("up"); loadFile(item.getAsFile()); }
  });

  /* ---------------- run + render ---------------- */
  async function runPrediction(source) {
    const card = $("#resultCard");
    card.querySelector(".result-empty").style.opacity = ".4";
    const res = await MangroveModel.predict(source);
    renderResult(res);
    pushHistory(res);
  }

  function renderResult(res) {
    const card = $("#resultCard");
    card.classList.remove("empty");
    card.querySelector(".result-empty").hidden = true;
    card.querySelector(".result-body").hidden = false;

    const info = speciesInfo(res.top.key, state.lang) || { name: res.top.key, sci: "", family: "", type: "", tags: [], desc: "" };
    const pct = Math.round(res.top.p * 100);

    $("#rImg").src = res.thumb;
    $("#rName").textContent = info.name;
    $("#rSci").textContent = info.sci;

    // ring
    const R = 52, C = 2 * Math.PI * R;
    const fg = $("#ringFg");
    fg.style.strokeDasharray = C;
    fg.style.strokeDashoffset = C * (1 - res.top.p);
    fg.style.stroke = pct >= state.thresh ? "var(--emerald)" : "var(--amber)";
    animateNum($("#rPct"), pct);

    // tags
    const tags = [info.family, info.type, ...info.tags].filter(Boolean);
    if (pct < state.thresh) tags.push("⚠ " + t("lowConf"));
    $("#rTags").innerHTML = tags.map((x, i) =>
      `<span class="tag${i === tags.length - 1 && pct < state.thresh ? " warn" : ""}">${esc(x)}</span>`).join("");

    // description
    $("#rDesc").textContent = info.desc;

    // breakdown bars
    $("#rBars").innerHTML = res.ranked.map(r => {
      const ni = speciesInfo(r.key, state.lang);
      const p = Math.round(r.p * 100);
      return `<div class="bar-row"><span>${esc(ni ? ni.name : r.key)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div>
        <span class="bar-val">${p}%</span></div>`;
    }).join("");

    // feedback: เสียง + สั่นเบาๆ (ไม่มีเอฟเฟกต์พุ่ง)
    playDing(pct >= 90); haptic(pct >= 90 ? [20, 40, 30] : 25);
    recordStat(res.top.key, res.top.p);
  }

  function animateNum(el, target) {
    let cur = 0; const step = Math.max(1, Math.round(target / 24));
    clearInterval(el._t);
    el._t = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(el._t); } el.textContent = cur; }, 16);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------------- history (localStorage) ---------------- */
  function getHist() { try { return JSON.parse(localStorage.getItem("mid_hist") || "[]"); } catch { return []; } }
  function pushHistory(res) {
    const h = getHist();
    h.unshift({ key: res.top.key, p: res.top.p, thumb: res.thumb, ts: Date.now() });
    localStorage.setItem("mid_hist", JSON.stringify(h.slice(0, 12)));
    renderHist();
  }
  function renderHist() {
    const list = $("#histList");
    list.innerHTML = getHist().map(h => {
      const info = speciesInfo(h.key, state.lang);
      return `<div class="hist-item" data-thumb="${h.thumb}"><img src="${h.thumb}" alt="">
        <small>${esc(info ? info.name : h.key)} · ${Math.round(h.p * 100)}%</small></div>`;
    }).join("");
    list.querySelectorAll(".hist-item").forEach(el => el.onclick = () => {
      setMode("up"); preview.hidden = false; $("#dropHint").hidden = true; $("#rescanBtn").hidden = false;
      preview.src = el.dataset.thumb;
      preview.onload = () => runPrediction(preview);
    });
  }
  $("#clearHist").onclick = () => { localStorage.removeItem("mid_hist"); renderHist(); };

  /* ---------------- settings drawer ---------------- */
  const drawer = $("#drawer");
  const openDrawer = () => { drawer.hidden = false; };
  const closeDrawer = () => { drawer.hidden = true; };
  $("#settingsBtn").onclick = openDrawer;
  $("#closeDrawer").onclick = closeDrawer;
  $("#drawerScrim").onclick = closeDrawer;
  const thr = $("#thresh"), itv = $("#interval");
  thr.value = state.thresh; $("#threshOut").textContent = state.thresh + "%";
  itv.value = state.interval; $("#intervalOut").textContent = state.interval + "ms";
  thr.oninput = () => { state.thresh = +thr.value; $("#threshOut").textContent = state.thresh + "%"; localStorage.setItem("mid_thresh", state.thresh); };
  itv.oninput = () => { state.interval = +itv.value; $("#intervalOut").textContent = state.interval + "ms"; localStorage.setItem("mid_interval", state.interval); };

  /* ---------------- language ---------------- */
  $("#langBtn").onclick = () => {
    state.lang = state.lang === "th" ? "en" : "th";
    localStorage.setItem("mid_lang", state.lang);
    applyI18n(); renderHist(); renderEncy(); renderDash();
    if (!$("#resultCard").classList.contains("empty")) {
      // re-render last result text in new language
      const last = getHist()[0];
      if (last) { const info = speciesInfo(last.key, state.lang); if (info) {
        $("#rName").textContent = info.name; $("#rSci").textContent = info.sci; $("#rDesc").textContent = info.desc;
      }}
    }
  };

  /* ---------------- spores background ---------------- */
  (function spores() {
    const cv = $("#spores"), ctx = cv.getContext("2d");
    let W, H, pts;
    const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight;
      pts = Array.from({ length: Math.min(70, Math.floor(W / 22)) }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + .5,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, a: Math.random() * .5 + .2 })); };
    resize(); addEventListener("resize", resize);
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = `rgba(80,240,200,${p.a})`; ctx.fill();
      }
      requestAnimationFrame(tick);
    })();
  })();

  /* ---------------- views: scan / encyclopedia ---------------- */
  const HUES = [150, 175, 110, 190, 38];
  function renderEncy() {
    const grid = $("#encyGrid"); if (!grid) return;
    grid.innerHTML = CLASS_ORDER.map((key, i) => {
      const s = speciesInfo(key, state.lang) || { name: key, sci: "", family: "", type: "", tags: [], desc: "" };
      const feats = (s.tags || []).map(x => `<li>${esc(x)}</li>`).join("");
      return `<article class="spcard" style="--h:${HUES[i % HUES.length]}">
        <div class="spcard-banner">
          <img src="assets/img/${key}.jpg" loading="lazy" alt="${esc(s.name)}" onerror="this.remove()">
          <span class="spcard-idx">${i + 1}</span>
          <svg class="spcard-leaf" viewBox="0 0 32 32"><path d="M16 2c3 6 9 8 9 15a9 9 0 1 1-18 0c0-7 6-9 9-15Z" fill="currentColor"/></svg>
          <span class="spcard-sci">${esc(s.sci)}</span>
        </div>
        <div class="spcard-body">
          <h3>${esc(s.name)}</h3>
          <div class="tags"><span class="tag">${esc(s.family)}</span><span class="tag">${esc(s.type)}</span></div>
          <ul class="spcard-feat">${feats}</ul>
          <p class="desc">${esc(s.desc)}</p>
          <div class="spcard-shots">
            <img src="assets/img/${key}_1.jpg" loading="lazy" alt="" onerror="this.remove()">
            <img src="assets/img/${key}_2.jpg" loading="lazy" alt="" onerror="this.remove()">
            <img src="assets/img/${key}_3.jpg" loading="lazy" alt="" onerror="this.remove()">
          </div>
        </div></article>`;
    }).join("");
  }
  function setView(v) {
    $("#viewScan").hidden = v !== "scan";
    $("#viewEncy").hidden = v !== "ency";
    $("#viewDash").hidden = v !== "dash";
    $("#navScan").classList.toggle("is-active", v === "scan");
    $("#navEncy").classList.toggle("is-active", v === "ency");
    $("#navDash").classList.toggle("is-active", v === "dash");
    if (v !== "scan") { stopLive(); stopCamera(); }
    else if (state.mode === "cam") { startCamera(); }
    scrollTo(0, 0);
  }
  $("#navScan").onclick = () => setView("scan");
  $("#navEncy").onclick = () => { renderEncy(); setView("ency"); };
  $("#navDash").onclick = () => { renderDash(); setView("dash"); };

  /* ---- scan statistics ---- */
  function getStats() { try { return JSON.parse(localStorage.getItem("mid_stats") || "{}"); } catch { return {}; } }
  function recordStat(key, p) {
    const s = getStats();
    s.total = (s.total || 0) + 1;
    s.byClass = s.byClass || {};
    s.byClass[key] = (s.byClass[key] || 0) + 1;
    s.confSum = (s.confSum || 0) + (p || 0);
    s.last = Date.now();
    localStorage.setItem("mid_stats", JSON.stringify(s));
  }
  function renderDash() {
    const s = getStats(), total = s.total || 0;
    $("#dashEmpty").hidden = total > 0;
    $("#dashBody").hidden = total === 0;
    if (!total) return;
    const by = s.byClass || {};
    const rows = CLASS_ORDER.map(k => ({ k, c: by[k] || 0 })).sort((a, b) => b.c - a.c);
    const maxc = Math.max(1, ...rows.map(r => r.c)), top = rows[0];
    $("#kpiTotal").textContent = total;
    $("#kpiAvg").textContent = Math.round((s.confSum || 0) / total * 100) + "%";
    $("#kpiTop").textContent = (top && top.c) ? ((speciesInfo(top.k, state.lang) || {}).name || top.k) : "—";
    $("#kpiSpecies").textContent = rows.filter(r => r.c > 0).length;
    $("#dashBars").innerHTML = rows.map(r => {
      const ni = speciesInfo(r.k, state.lang), pct = Math.round(r.c / total * 100), w = Math.round(r.c / maxc * 100);
      return `<div class="dash-row"><span>${esc(ni ? ni.name : r.k)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${w}%;--h:${HUES[CLASS_ORDER.indexOf(r.k)]}"></div></div>
        <span class="bar-val">${r.c} · ${pct}%</span></div>`;
    }).join("");
  }
  $("#dashClear").onclick = () => { localStorage.removeItem("mid_stats"); renderDash(); };

  /* ---------------- feedback: sound + haptic ---------------- */
  state.sound = localStorage.getItem("mid_sound") !== "0";
  let audioCtx = null;
  function playDing(strong) {
    if (!state.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), now = audioCtx.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(strong ? 760 : 660, now);
      o.frequency.exponentialRampToValueAtTime(strong ? 1380 : 990, now + 0.12);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + 0.37);
    } catch (e) {}
  }
  function haptic(p) { if (state.sound && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }

  /* ---------------- celebration burst ---------------- */
  function celebrate() {
    let cv = document.getElementById("fx");
    if (!cv) { cv = document.createElement("canvas"); cv.id = "fx"; document.body.appendChild(cv); }
    const ctx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
    const colors = ["#2fe6a4", "#39d9e6", "#ffc56b", "#ffffff"];
    const ox = innerWidth / 2, oy = innerHeight * 0.34;
    const parts = Array.from({ length: 100 }, () => ({
      x: ox, y: oy, vx: (Math.random() - .5) * 13, vy: (Math.random() - 1) * 13,
      g: .28 + Math.random() * .22, r: 3 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)], life: 55 + Math.random() * 35, t: 0
    }));
    (function anim() {
      ctx.clearRect(0, 0, cv.width, cv.height); let alive = false;
      for (const p of parts) if (p.t < p.life) {
        alive = true; p.t++; p.vy += p.g; p.x += p.vx; p.y += p.vy;
        ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * .2); ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (alive) requestAnimationFrame(anim); else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  /* ---------------- stat counters ---------------- */
  function runCounters() {
    document.querySelectorAll(".stat b[data-count]").forEach(el => {
      const target = +el.dataset.count, dur = 1100, t0 = performance.now();
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------------- share / save result as image ---------------- */
  async function cardToBlob() {
    if (typeof html2canvas === "undefined") throw new Error("html2canvas ไม่พร้อม");
    const canvas = await html2canvas($("#resultCard"), { backgroundColor: "#0c2620", scale: 2, useCORS: true, logging: false });
    return await new Promise(res => canvas.toBlob(res, "image/png"));
  }
  $("#saveBtn").onclick = async () => {
    try {
      const blob = await cardToBlob(), a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "plant-index-result.png"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) { alert("บันทึกไม่ได้: " + e.message); }
  };
  $("#shareBtn").onclick = async () => {
    try {
      const blob = await cardToBlob(), file = new File([blob], "plant-index-result.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Plant Index", text: "ผลการจำแนกพันธุ์ไม้" });
      } else {
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "plant-index-result.png"; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    } catch (e) { /* user cancelled */ }
  };

  /* ---------------- lightbox ---------------- */
  let lbList = [], lbIdx = 0;
  function openLightbox(list, idx) { lbList = list; lbIdx = idx; $("#lbImg").src = lbList[lbIdx]; $("#lightbox").hidden = false; }
  function lbShow(d) { if (!lbList.length) return; lbIdx = (lbIdx + d + lbList.length) % lbList.length; $("#lbImg").src = lbList[lbIdx]; }
  $("#lbClose").onclick = () => $("#lightbox").hidden = true;
  $("#lbPrev").onclick = () => lbShow(-1);
  $("#lbNext").onclick = () => lbShow(1);
  $("#lightbox").onclick = (e) => { if (e.target.id === "lightbox") $("#lightbox").hidden = true; };
  $("#encyGrid").addEventListener("click", (e) => {
    const img = e.target.closest("img"); if (!img) return;
    const card = img.closest(".spcard"); if (!card) return;
    const imgs = [...card.querySelectorAll("img")].map(i => i.src);
    openLightbox(imgs, Math.max(0, imgs.indexOf(img.src)));
  });
  $("#rImg").addEventListener("click", () => { if ($("#rImg").src) openLightbox([$("#rImg").src], 0); });

  /* ---------------- sound toggle ---------------- */
  const soundToggle = $("#soundToggle");
  if (soundToggle) {
    soundToggle.checked = state.sound;
    soundToggle.onchange = () => { state.sound = soundToggle.checked; localStorage.setItem("mid_sound", state.sound ? "1" : "0"); };
  }

  /* ---------------- PWA: service worker + install ---------------- */
  if ("serviceWorker" in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").then((r) => r.update()).catch(() => {}));
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController) location.reload(); });
  }
  let deferredPrompt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; $("#installBtn").hidden = false; });
  $("#installBtn").onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $("#installBtn").hidden = true;
  };

  /* ---------------- boot ---------------- */
  applyI18n();
  renderHist();
  renderEncy();
  setMode("cam");
  addEventListener("beforeunload", () => stopCamera());
})();
