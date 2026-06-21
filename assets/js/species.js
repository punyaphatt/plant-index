/* ============================================================
   Mangrove species database (bilingual TH / EN)
   ⚠️ CLASS_ORDER ต้องเรียงให้ตรงกับ model.names ของ Ultralytics
      (เรียงตามชื่อโฟลเดอร์แบบ alphabetical)
   ============================================================ */
const CLASS_ORDER = ["kongkang", "lamphu", "prong", "samae_thale", "tabun"];

const SPECIES = {
  kongkang: {
    sci: "Rhizophora mucronata",
    family: { th: "วงศ์ Rhizophoraceae", en: "Rhizophoraceae" },
    th: {
      name: "โกงกางใบใหญ่",
      type: "ไม้ยืนต้นป่าชายเลน",
      tags: ["รากค้ำยัน (prop roots)", "ฝักงอกติดต้น (vivipary)"],
      desc: "โกงกางใบใหญ่เป็นไม้เด่นประจำป่าชายเลน สังเกตง่ายจากรากค้ำยันโค้งแตกแขนงที่ช่วยยึดลำต้นไว้ในเลนนิ่ม " +
            "ใบหนาเป็นมัน และผลงอกเป็นฝักยาวคล้ายซิการ์ตั้งแต่ยังติดอยู่บนต้นแม่ (vivipary) " +
            "เป็นพืชหลักที่นิยมใช้ปลูกฟื้นฟูป่าชายเลนและเผาถ่านคุณภาพสูง"
    },
    en: {
      name: "Red Mangrove",
      type: "Mangrove tree",
      tags: ["Stilt / prop roots", "Viviparous propagules"],
      desc: "Rhizophora mucronata, the loop-root or red mangrove, is a dominant coastal tree easily recognized by " +
            "its arching stilt (prop) roots that anchor it firmly in soft tidal mud. Its thick, glossy leaves and " +
            "long cigar-shaped propagules — which germinate while still attached to the parent tree — make it a " +
            "keystone species widely used for mangrove reforestation and high-grade charcoal production."
    }
  },

  lamphu: {
    sci: "Sonneratia caseolaris",
    family: { th: "วงศ์ Lythraceae", en: "Lythraceae" },
    th: {
      name: "ลำพู",
      type: "ไม้ยืนต้นริมน้ำกร่อย",
      tags: ["รากหายใจรูปกรวยแหลม", "ดอกบานกลางคืน"],
      desc: "ลำพูขึ้นบริเวณน้ำจืดปนเค็มริมแม่น้ำ มีรากหายใจรูปกรวยแหลมโผล่พ้นดิน ดอกขนาดใหญ่บานกลางคืน " +
            "ดึงดูดค้างคาวและแมลง ผลกลมแบนรสเปรี้ยวกินได้ และเป็นแหล่งอาศัยที่มีชื่อเสียงของหิ่งห้อยที่กะพริบพร้อมกัน"
    },
    en: {
      name: "Mangrove Apple",
      type: "Riverine mangrove tree",
      tags: ["Conical breathing roots", "Night-blooming flowers"],
      desc: "Sonneratia caseolaris, the mangrove apple, grows along brackish-to-freshwater riverbanks and is noted " +
            "for its tall, cone-shaped pneumatophores and large night-blooming flowers that attract bats and moths. " +
            "Its round, flattened, sour-tasting fruit is edible, and the tree is a famous gathering site for colonies " +
            "of synchronously flashing fireflies."
    }
  },

  prong: {
    sci: "Ceriops tagal",
    family: { th: "วงศ์ Rhizophoraceae", en: "Rhizophoraceae" },
    th: {
      name: "โปรงแดง",
      type: "ไม้พุ่ม/ไม้ต้นป่าชายเลน",
      tags: ["รากค้ำยัน/พูพอน", "ฝักงอกติดต้น (vivipary)"],
      desc: "โปรงแดงเป็นไม้ขนาดย่อมในวงศ์เดียวกับโกงกาง พบในโซนพื้นที่ดอนที่น้ำท่วมถึงเป็นครั้งคราว " +
            "ค้ำลำต้นด้วยรากค้ำยันและพูพอนเรียวเล็ก ขยายพันธุ์ด้วยฝักงอกแบบ vivipary ที่สั้นกว่าโกงกาง " +
            "เปลือกอุดมด้วยแทนนินใช้ฟอกหนังและย้อมสีมาแต่โบราณ"
    },
    en: {
      name: "Yellow Mangrove",
      type: "Mangrove shrub / tree",
      tags: ["Buttress / stilt roots", "Viviparous propagules"],
      desc: "Ceriops tagal, the yellow or spurred mangrove, is a smaller relative of the true mangroves " +
            "(family Rhizophoraceae) that favours firmer, less frequently flooded ground. It supports itself with " +
            "slender buttress and stilt roots and reproduces by viviparous propagules shorter than those of " +
            "Rhizophora. Its tannin-rich bark has long been used for tanning leather and producing natural dyes."
    }
  },

  samae_thale: {
    sci: "Avicennia marina",
    family: { th: "วงศ์ Acanthaceae", en: "Acanthaceae" },
    th: {
      name: "แสมทะเล",
      type: "ไม้เบิกนำป่าชายเลน",
      tags: ["รากหายใจรูปดินสอ", "ทนเค็มสูง"],
      desc: "แสมทะเลเป็นไม้เบิกนำที่ทนเค็มและทนสภาพแวดล้อมรุนแรงริมทะเลได้ดีเยี่ยม มีรากหายใจรูปดินสอ " +
            "จำนวนมากโผล่ขึ้นเหนือเลนเพื่อแลกเปลี่ยนอากาศ ใต้ใบมีขนสีเทาเงินและขับเกลือส่วนเกินออกทางใบ " +
            "มักขึ้นเป็นแนวด้านนอกสุดที่ติดทะเลของป่าชายเลน"
    },
    en: {
      name: "Grey Mangrove",
      type: "Pioneer mangrove tree",
      tags: ["Pencil roots (pneumatophores)", "Highly salt-tolerant"],
      desc: "Avicennia marina, the grey mangrove, is an exceptionally hardy pioneer species that tolerates high " +
            "salinity and harsh, exposed shorelines. It is characterized by dense fields of pencil-like aerial roots " +
            "(pneumatophores) rising from the mud for gas exchange, and silvery-haired leaf undersides that excrete " +
            "excess salt. It typically forms the seaward front of the mangrove forest."
    }
  },

  tabun: {
    sci: "Xylocarpus granatum",
    family: { th: "วงศ์ Meliaceae", en: "Meliaceae" },
    th: {
      name: "ตะบูนขาว",
      type: "ไม้ยืนต้นป่าชายเลน",
      tags: ["รากแผ่เป็นแผ่นคดเคี้ยว", "ผลกลมใหญ่"],
      desc: "ตะบูนขาวมีเปลือกเรียบลอกเป็นแผ่นสีน้ำตาลแดง และรากแผ่คดเคี้ยวคล้ายแผ่นริบบิ้นเลื้อยบนผิวเลน " +
            "ผลกลมขนาดใหญ่หนักคล้ายลูกปืนใหญ่ ภายในมีเมล็ดเหลี่ยมจัดเรียงอัดแน่น " +
            "ชอบขึ้นในเขตที่น้ำท่วมถึงอย่างสม่ำเสมอของป่าชายเลน"
    },
    en: {
      name: "Cannonball Mangrove",
      type: "Mangrove tree",
      tags: ["Ribbon plank roots", "Large cannonball fruit"],
      desc: "Xylocarpus granatum, the cannonball or cedar mangrove, has smooth bark that flakes away in reddish-brown " +
            "patches and distinctive ribbon-like plank roots that snake across the mud surface. It produces large, " +
            "heavy spherical fruits resembling cannonballs, packed inside with tightly interlocking angular seeds, " +
            "and prefers the regularly inundated zones of the forest."
    }
  }
};

/* helper: ดึงข้อมูลพันธุ์ตามภาษาปัจจุบัน */
function speciesInfo(key, lang) {
  const s = SPECIES[key];
  if (!s) return null;
  const L = s[lang] || s.en;
  return {
    key, sci: s.sci,
    name: L.name, type: L.type, tags: L.tags || [],
    family: (s.family[lang] || s.family.en),
    desc: L.desc
  };
}
