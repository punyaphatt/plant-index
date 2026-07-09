/* ============================================================
   model.js — ONNX Runtime Web inference for YOLOv8-cls
   - โหลด model/best.onnx ถ้ามี → โหมดจริง
   - ถ้าไม่มี/โหลดไม่ได้ → Demo mode (สุ่มแบบคงที่ต่อรูป)
   ============================================================ */
const MangroveModel = (() => {
  const MODEL_URL = "model/best.onnx";
  const IMG = 224;
  let session = null;
  let ready = false;
  let demo = true;          // true จนกว่าจะโหลดโมเดลจริงสำเร็จ
  let inputName = "images";

  async function init() {
    try {
      if (typeof ort === "undefined") throw new Error("onnxruntime-web ยังไม่ถูกโหลด");
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/";
      // เช็คว่ามีไฟล์โมเดลไหม (HEAD)
      const head = await fetch(MODEL_URL, { method: "HEAD" }).catch(() => null);
      if (!head || !head.ok) throw new Error("ไม่พบไฟล์โมเดล (" + MODEL_URL + ")");

      session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all"
      });
      inputName = session.inputNames[0] || "images";
      demo = false; ready = true;
      return { ok: true, demo: false };
    } catch (e) {
      console.warn("[MangroveModel] ใช้ Demo mode:", e.message);
      demo = true; ready = true;
      return { ok: true, demo: true, reason: e.message };
    }
  }

  /* ---- preprocess: center-crop เป็นสี่เหลี่ยม → resize 224 → CHW float /255 ---- */
  function preprocess(source) {
    const c = document.createElement("canvas");
    c.width = IMG; c.height = IMG;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    const side = Math.min(sw, sh);
    const sx = (sw - side) / 2, sy = (sh - side) / 2;
    ctx.drawImage(source, sx, sy, side, side, 0, 0, IMG, IMG);
    const { data } = ctx.getImageData(0, 0, IMG, IMG);

    const arr = new Float32Array(3 * IMG * IMG);
    const plane = IMG * IMG;
    let plantPixels = 0;
    for (let i = 0; i < plane; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      arr[i]             = r / 255; // R
      arr[plane + i]     = g / 255; // G
      arr[2 * plane + i] = b / 255; // B

      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const saturation = max > 0 ? (max - min) / max : 0;
      const excessGreen = 2 * g - r - b;
      if (g > 45 && saturation > 0.12 && excessGreen > 18 && g > r * 1.04 && g > b * 1.04) plantPixels++;
    }
    return { tensorData: arr, thumb: c.toDataURL("image/jpeg", 0.85), plantScore: plantPixels / plane };
  }

  function softmax(a) {
    const m = Math.max(...a);
    const ex = a.map(v => Math.exp(v - m));
    const s = ex.reduce((p, c) => p + c, 0);
    return ex.map(v => v / s);
  }

  /* ---- demo: สุ่มแบบคงที่ตามค่าพิกเซล (รูปเดิม = ผลเดิม) ---- */
  function demoPredict(arr) {
    let h = 2166136261;
    for (let i = 0; i < arr.length; i += 997) {
      h ^= Math.floor(arr[i] * 255); h = Math.imul(h, 16777619);
    }
    const n = CLASS_ORDER.length;
    const raw = [];
    for (let i = 0; i < n; i++) { h = Math.imul(h ^ (i + 7), 2654435761); raw.push(((h >>> 0) % 1000) / 1000); }
    const top = (h >>> 0) % n;
    raw[top] += 1.6;                         // ให้มีคลาสเด่นชัด
    return softmax(raw.map(v => v * 3));
  }

  /* ---- ทำนาย: source = <video>|<img>|<canvas> ---- */
  async function predict(source) {
    const { tensorData, thumb, plantScore } = preprocess(source);
    let probs;
    if (demo || !session) {
      probs = demoPredict(tensorData);
    } else {
      const t = new ort.Tensor("float32", tensorData, [1, 3, IMG, IMG]);
      const out = await session.run({ [inputName]: t });
      const raw = Array.from(out[session.outputNames[0]].data);
      const s = raw.reduce((p, c) => p + c, 0);
      // ถ้า output ยังไม่ผ่าน softmax (รวมไม่ ≈ 1) ให้ softmax เอง
      probs = (Math.abs(s - 1) < 0.02 && raw.every(v => v >= 0)) ? raw : softmax(raw);
    }
    const ranked = CLASS_ORDER
      .map((key, i) => ({ key, p: probs[i] ?? 0 }))
      .sort((a, b) => b.p - a.p);
    return { ranked, top: ranked[0], thumb, demo, plantScore };
  }

  return { init, predict, isDemo: () => demo, isReady: () => ready };
})();
