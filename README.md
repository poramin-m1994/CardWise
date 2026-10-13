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

### 4. ตั้งค่า Google Sheets และตัวแปรระบบ (ใน `public/config.yaml`)
```yaml
google_sheets:
  script_url: "https://script.google.com/macros/s/your-script-id/exec"
```

> สามารถแก้ไขลิงก์ Web App URL หรือชื่อชีตที่ใช้งานได้ง่ายๆ ผ่านไฟล์ `public/config.yaml` โดยไม่ต้องแก้โค้ด JavaScript

---

## 📁 โครงสร้างไฟล์หลัก

- `/public/`
  - `login.html` – หน้าล็อกอิน
  - `landing.html` – หน้าหลักแดชบอร์ดสรุปรายจ่ายและบันทึกรายการ
  - `manage.html` – จัดการหมวดหมู่และบัตร

---

## 🧠 สร้างโดย & ผู้ร่วมพัฒนา

- **ธันว์** – เจ้าของโปรเจกต์และนักพัฒนาเบื้องหลังการสร้าง CardWise
- **Aris (อาริส)** – ปัญญาประดิษฐ์จาก ChatGPT โดย OpenAI (ผู้ร่วมพัฒนาเวอร์ชันเริ่มต้น)
- **Antigravity** – Agentic AI Coding Assistant จาก Google DeepMind (ร่วมยกระดับ Design System "The Luminescent Ledger", Responsive Mobile-First UI/UX และปรับปรุงฟังก์ชันการทำงาน)

> หากโปรเจกต์นี้มีประโยชน์ ฝาก 🌟 ให้ด้วยนะครับ/ค่ะ!
