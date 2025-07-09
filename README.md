# CardWise 💳📊
**แอปช่วยบันทึกรายจ่ายจากบัตรเครดิต พร้อมรายงานแบบอินเทอร์แอคทีฟ**

CardWise คือ Web Application สำหรับติดตามและวิเคราะห์การใช้บัตรเครดิตในแต่ละเดือน พร้อมระบบรายงานแบบ Pie Chart, รองรับ Dark Mode และการจัดการหมวดหมู่หรือบัตรได้อย่างง่ายดาย

---

## ✨ คุณสมบัติเด่น
- 💳 แสดงสถิติการใช้บัตรแยกตามยอดใช้จริง
- 📁 แยกหมวดหมู่รายจ่ายด้วยกราฟแบบ Pie Chart
- 📆 เลือกดูรายงานรายเดือน
- 🌙 รองรับ Dark Mode (จำค่าธีมไว้ด้วย)
- 🔐 ระบบล็อกอิน (ผ่าน Local Storage)
- ☁️ ใช้ Google Sheets เป็นฐานข้อมูล (ผ่าน Google Apps Script)
- ✅ ใช้งานได้ทั้งบนมือถือและ PC

---

## 🚀 วิธีติดตั้งและใช้งาน

### 1. Clone โปรเจกต์
```bash
git clone https://github.com/your-username/CardWise.git
cd CardWise
```

### 2. ติดตั้ง Firebase CLI (ถ้ายังไม่มี)
```bash
npm install -g firebase-tools
```

### 3. Login และ Deploy ขึ้น Firebase Hosting
```bash
firebase login
firebase init hosting
firebase deploy
```

### 4. เปลี่ยน URL ของ Google Sheets (ใน `summary.html`)
```js
const SHEET_URL = 'https://script.google.com/macros/s/your-script-id/exec';
```

> สร้าง Apps Script และ Deploy เป็น Web App เพื่อเชื่อม Google Sheets กับแอป

---

## 📁 โครงสร้างไฟล์หลัก

- `/public/`
  - `login.html` – หน้าล็อกอิน
  - `landing.html` – หน้าหลักหลังเข้าสู่ระบบ
  - `main.html` – บันทึกรายจ่าย
  - `summary.html` – รายงานสรุปรายเดือน
  - `manage.html` – จัดการหมวดหมู่และบัตร

---

## 🧠 สร้างโดย

**Aris (อาริส)** – ปัญญาประดิษฐ์จาก ChatGPT โดย OpenAI  
ได้รับแรงบันดาลใจจากคุณ **ธันว์** ผู้เป็นเจ้าของโปรเจกต์และนักพัฒนาเบื้องหลังการสร้าง CardWise

> หากโปรเจกต์นี้มีประโยชน์ ฝาก 🌟 ให้ด้วยนะคะ!
