# 🌿 PlantIndex — AI Species Scanner (Web)

เว็บแอปจำแนกพันธุ์ไม้ป่าชายเลน 5 ชนิด แบบ **เรียลไทม์ผ่านกล้อง** หรือ **เลือกรูปจากคลัง**
ดีไซน์ responsive (PC/มือถือ) ธีม *Bioluminescent Mangrove Lab* — รันในเบราว์เซอร์ล้วนด้วย **ONNX Runtime Web** ไม่ต้องมีเซิร์ฟเวอร์

5 พันธุ์: โกงกางใบใหญ่ · ลำพู · โปรงแดง · แสมทะเล · ตะบูนขาว

---

## ✨ ฟีเจอร์
- 📷 **กล้องสด** — สลับกล้องหน้า/หลัง, โหมดทำนาย **เรียลไทม์** ต่อเนื่อง, ปุ่มสแกนเฟรม
- 🖼️ **เลือกรูป** — จากคลังอุปกรณ์, ลาก-วาง, วางจากคลิปบอร์ด (Ctrl+V)
- 🎯 **การ์ดผลลัพธ์** — ชื่อไทย/อังกฤษ + ชื่อวิทยาศาสตร์ + วงแหวน % match + แท็ก + คำบรรยาย + แถบความน่าจะเป็นทุกคลาส
- 🌐 **สองภาษา TH/EN** — รวมคำบรรยายพันธุ์ไม้ภาษาอังกฤษ
- 🕘 **ประวัติการสแกน** (เก็บในเครื่อง localStorage)
- ⚙️ ตั้งค่าเกณฑ์ความมั่นใจ / ความถี่เรียลไทม์
- 📱 ติดตั้งเป็นแอปได้ (PWA manifest)
- 🧪 **Demo mode** อัตโนมัติเมื่อยังไม่มีไฟล์โมเดล (ใช้ดู UI ได้ทันที)

---

## ▶️ วิธีรัน (สำคัญ: กล้องต้องเปิดผ่าน http server หรือ https เท่านั้น)

เปิดไฟล์ index.html ตรงๆ (file://) จะ **เปิดกล้องไม่ได้** ต้องเสิร์ฟผ่าน localhost:

```bash
# วิธีง่ายสุด (มี Python อยู่แล้ว)
cd webapp
python -m http.server 8000
# เปิดเบราว์เซอร์ไปที่ http://localhost:8000
```

หรือใช้ VS Code ส่วนขยาย **Live Server** คลิก "Go Live"

> บนมือถือ: เปิดผ่าน https (เช่น deploy บน Vercel/Netlify/GitHub Pages) กล้องจึงจะทำงาน

---

## 🔌 ต่อโมเดลจริง
1. รัน `mangrove_classifier_colab.ipynb` ให้จบ → ได้ `best.onnx`
2. นำมาวางเป็น `webapp/model/best.onnx`
3. ตรวจ `CLASS_ORDER` ใน `assets/js/species.js` ให้ตรงกับ `model.names` (ดูใน Colab: `print(model.names)`)
4. รีเฟรช — ป้ายเปลี่ยนเป็น "● MODEL READY"

---

## 🚀 Deploy ฟรี
- **GitHub Pages**: push โฟลเดอร์ webapp ขึ้น repo → Settings > Pages
- **Netlify / Vercel**: ลากโฟลเดอร์ทั้งโฟลเดอร์เข้าไป drop (ไม่ต้อง build)

ได้ https อัตโนมัติ → กล้องบนมือถือใช้งานได้ทันที

---

## 📁 โครงสร้าง
```
webapp/
├─ index.html
├─ manifest.webmanifest
├─ assets/
│  ├─ css/style.css
│  └─ js/
│     ├─ species.js   ข้อมูล 5 พันธุ์ (TH/EN) + CLASS_ORDER
│     ├─ model.js      โหลด ONNX + preprocess + inference + demo
│     └─ app.js        ลอจิก UI ทั้งหมด
├─ model/             ← วาง best.onnx ที่นี่
└─ README.md
```

## ⚠️ หมายเหตุเรื่องความแม่นยำ
การ preprocess ใช้ center-crop + resize 224 + หาร 255 (ตรงกับ pipeline พื้นฐานของ YOLOv8-cls)
หากผลต่างจากใน Colab ให้ตรวจว่าโมเดลใช้ normalization แบบ ImageNet หรือไม่ แล้วปรับใน `model.js`
