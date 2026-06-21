วางไฟล์โมเดลที่นี่
====================

1) ในโน้ตบุ๊ก Colab (mangrove_classifier_colab.ipynb) เซลล์ที่ 9 จะ export ไฟล์
   - best.pt   (PyTorch)
   - best.onnx (ONNX)   ← ใช้ไฟล์นี้

2) เปลี่ยนชื่อไฟล์ ONNX เป็น  best.onnx  แล้วนำมาวางในโฟลเดอร์ model/ นี้
   ให้ได้ path:  webapp/model/best.onnx

3) รีเฟรชหน้าเว็บ — ป้ายมุมขวาบนจะเปลี่ยนจาก "◈ DEMO" เป็น "● MODEL READY"

หมายเหตุสำคัญ:
- ลำดับคลาสในไฟล์ assets/js/species.js (ตัวแปร CLASS_ORDER) ต้องตรงกับ model.names ของโมเดล
  ค่าเริ่มต้นเรียงตามตัวอักษร: ["kongkang","lamphu","prong","samae_thale","tabun"]
  ตรวจสอบได้ใน Colab ด้วย:  print(model.names)
- ถ้าโมเดลใช้ input ขนาดอื่น (ไม่ใช่ 224) ให้แก้ค่า IMG ใน assets/js/model.js
