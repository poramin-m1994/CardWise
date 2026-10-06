# Design System & Style Guide: CardWise 💳✨

## 1. Overview & Creative North Star: "The Luminescent Ledger"

CardWise ปรับโฉมเป็นระบบบันทึกและวิเคราะห์การเงินที่ให้ความรู้สึกแบบ **High-Performance Cockpit** ที่เน้นความชัดเจน ทันสมัย และลดความล้าของสายตา โดยใช้แนวคิด **Tonal Layering (การไล่ระดับความลึกของพื้นผิว)** แทนการตัดขอบด้วยเส้นทึบแข็งแบบเดิม

- **Atmospheric Void**: พื้นหลังระดับ Void ดำอมน้ำเงินลึก ให้แสงสว่างเรืองรองจากตัวเลขสำคัญและกราฟิก
- **Luminescent Accents**: สีเขียว Mint สว่างเรืองแสงเป็นตัวแทนของความมั่งคั่งและปุ่มแอ็กชันหลัก
- **Mobile-First Tactility**: รองรับการใช้งานมือเดียวบนสมาร์ตโฟนด้วย Bottom App Bar, Bottom Sheet Modal และรายการธุรกรรมแบบกระชับ

---

## 2. Color Tokens & Palette

| Token Name | Hex / Value | Description |
| :--- | :--- | :--- |
| **void** | `#060a14` | ผืนหลังหลักระดับ Void (ลึกสุด) |
| **surface-0** (Canvas) | `#070d1a` | พื้นหลังของ Layout & Section |
| **surface-1** (Card Level 1) | `#0e172a` | การ์ดหลัก, Dashboard Modules |
| **surface-2** (Card Level 2) | `#142038` | แถบเครื่องมือ, ปุ่มย่อย, Badge |
| **surface-3** (Inputs & Pills) | `#1b2a47` | ช่องกรอกข้อมูล, พื้นหลังตัวเลือกที่ยังไม่เลือก |
| **surface-4** (Hover / Border) | `#24375b` | สีสถานะ Hover และเส้นแบ่งบางพิเศษ |
| **mint** (Primary Accent) | `#34d399` | ปุ่มหลัก (CTA), รายรับ (+), สัญญาณความสำเร็จ |
| **mint-hover** | `#10b981` | สถานะ Hover ของปุ่มหลัก |
| **coral** (Debit / Negative) | `#fb7185` | ยอดค่าใช้จ่าย (-), การแจ้งเตือนข้อผิดพลาด |
| **slate-border** | `rgba(148, 163, 184, 0.10)` | ขอบโครงสร้างบางเบา (Ghost Border) |

---

## 3. Typography Scale & Pairing

- **Display & Latin Numbers**: `Plus Jakarta Sans` / `SF Pro Display` (น้ำหนัก 700, 800) พร้อม `tabular-nums` เพื่อให้ตัวเลขในตารางและยอดเงินจัดคอลัมน์ได้ตรงกันเสมอ
- **Thai Body & Headings**: `Prompt` / `Kanit` (น้ำหนัก 400, 500, 600) สื่อสารชัดเจน อ่านง่ายในทุกขนาดหน้าจอ
- **Visual Hierarchy**:
  - `Hero Amount`: 32px – 48px, Bold, Tabular figures
  - `Card Title`: 16px – 18px, Extrabold
  - `Body / Transaction`: 12px – 14px, Regular / Medium
  - `Meta / Timestamp`: 10px – 11px, Medium, Slate-400

---

## 4. Mobile-First & Responsive UX Guidelines

1. **Transaction List**:
   - **Mobile (< 640px)**: จัดเป็นแถวกระทัดรัด (Icon + Category/Timestamp ซ้าย, Amount/Note ขวา) แตะง่าย ใช้นิ้วโป้งสะดวก
   - **Tablet / Desktop (≥ 640px)**: กางออกเป็นตาราง 12-Column Grid แสดงวันที่, หมวดหมู่, บันทึกย่อ และยอดเงินชัดเจน
2. **Action Modals & Sheets**:
   - บนหน้าจอมือถือ ฟอร์มบันทึกค่าใช้จ่ายจะเลื่อนขึ้นมาเป็น **Bottom Sheet** พร้อม Drag Handle ด้านบน
   - ช่องกรอกจำนวนเงินเด่นชัดพร้อมสัญลักษณ์ `฿` ขนาดใหญ่
3. **Month / Year Picker**:
   - Popover Datepicker แสดงตารางเดือน 12 เดือน และปุ่มเลื่อนปี พ.ศ. พร้อมไฟบอกสถานะเดือนที่มีรายการข้อมูล
4. **Micro-Interactions**:
   - ปุ่มหลักทุกตัวมี `active:scale-[0.98]` และเงาเรืองแสง `shadow-glow-mint`

---

## 5. Component Style Checklist

- [x] **Glass Navigation**: `backdrop-blur-md` พร้อมขอบล่างบางเบา
- [x] **Category Pills**: สลับสถานะ Active แบบนุ่มนวลด้วยเงา Mint Glow
- [x] **Doughnut Charts**: วงแหวนแยกยอดบวก (+) และยอดลบ (-) อย่างเป็นระเบียบ
- [x] **Floating Action Button (FAB)**: ปุ่มลอยเข้าถึงได้ทันทีจากทุกมุมจอ
