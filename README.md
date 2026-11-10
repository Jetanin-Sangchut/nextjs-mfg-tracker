# Manufacturing Process Tracker

A prototype manufacturing order tracking platform built for the Software Engineer Preliminary Assignment.

**Live Demo:** https://nextjs-mfg-tracker.vercel.app

---

## Written Summary

### Requirements Summary

สร้างแพลตฟอร์มติดตามกระบวนการผลิต ที่ให้ผู้ใช้สามารถสร้างคำสั่งผลิต ดำเนินการผ่านลำดับขั้นตอนที่กำหนดไว้ (Step A → B → C) ติดตามการใช้ทรัพยากรในแต่ละขั้นตอน และดูสถานะภาพรวมของคำสั่งผลิตทั้งหมด

### From Requirements to Functional Specifications

โจทย์สามารถให้อิสระกำหนดขอบเขต และกฎเองได้ ผมเลือก **การบรรจุกระดาษ A4 (500 กรัม/รีม)** เป็นขอบเขต เพราะสามารถกำหนดการผลิดตได้ 3 ลำดับขั้นตอนแบบ linear พร้อมทรัพยากรที่แตกต่างกัน ทำให้แต่ละขั้นตอนและทรัพยากรสามารถตรวจสอบได้

กระบวนการผลิตออกแบบเป็น state machine: คำสั่งผลิตเคลื่อนผ่าน `PENDING → IN_PROGRESS → COMPLETED` (หรือ `REJECTED / CANCELLED / CUSTOMER_REJECTED`) การตัดสินใจหลักคือการแบ่งทรัพยากรออกเป็น 3 ประเภท — `MATERIAL` (เมื่อ submit ทำงานไปแล้วไม่สามารถไม่คืนจำนวนกลับได้), `MACHINE` และ `LABOUR` (เมื่อ submit จองใช้งานและคืนเมื่อแต่ละขั้นตอนเสร็จหรือคำสั่งถูกยกเลิก) — เพื่อให้สอดคล้องกับความเป็นจริงในโรงงาน ทุก state transition และการใช้ทรัพยากรถูกบันทึกเป็น immutable transaction log ตอบโจทย์ traceability

### Software Design

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui · Prisma 5 · PostgreSQL (Supabase)
- **Architecture:** Star Schema — `order_step_logs` and `resource_consumptions` as fact tables; `orders`, `steps`, `resources` as dimension tables. Thin page components delegate to server actions; REST API routes (`/api/*`) serve external consumers.
- **Key invariants:** double-spend guard on resource allocation; all transitions run inside a single Prisma `$transaction` (no partial state possible); audit tables are append-only with no soft-delete or edit endpoints.

### User Manual

1. **Dashboard** — ภาพรวมคำสั่งผลิตทั้งหมดแยกตามสถานะและขั้นตอนปัจจุบัน พร้อมตารางทรัพยากรคงเหลือ
2. **Orders → New Order** — กรอกเลขคำสั่ง ชื่อสินค้า จำนวน และกำหนดทรัพยากรแต่ละขั้นตอน การ submit จะจองใช้ทรัพยากรทันที
3. **Orders list** — คลิกคำสั่งใดก็ได้เพื่อดูรายละเอียด step logs และประวัติการใช้ทรัพยากร
4. **Advance** — กด **Advance Step** เพื่อจำลองเครื่องจักรทำขั้นตอนปัจจุบันเสร็จและเลื่อนไปขั้นถัดไป ทำซ้ำจนสถานะเป็น `COMPLETED`
5. **Approve** — shortcut สำหรับ operator เพื่อ complete ทุกขั้นตอนที่เหลือพร้อมกัน
6. **Reject / Cancel / Customer Reject** — ใช้ได้ตามสถานะที่กำหนด; คืนทรัพยากรที่ล็อกไว้ตามเงื่อนไข
7. **Logs** — หน้าแยกที่มี tab Step Logs และ Resource Logs กรองตาม order ได้

### Summary

แพลตฟอร์มนี้ตอบโจทย์ครบทั้ง 4 ข้อ — การสร้างคำสั่งผลิต การติดตามความคืบหน้าแต่ละขั้นตอน การตรวจสอบการใช้ทรัพยากร และภาพรวมสถานะคำสั่งทั้งหมด — ภายในระยะเวลาพัฒนา กำหนดขอบเขตการผลิตกระดาษ A4 ให้ seed data ที่เป็นรูปธรรมและสมจริง การออกแบบ transaction log แบบ immutable รับประกัน traceability ครบถ้วนโดยไม่ต้องพึ่ง event sourcing

ข้อจำกัดที่ทราบ: ไม่มีระบบ authentication หรือการแยก role ระหว่าง operator กับลูกค้า; Supabase free tier จะหยุดทำงานหลังไม่ใช้งาน 7 วัน (ต้อง wake project ก่อนทดสอบ live demo); และปุ่ม **Approve** แบบ batch จะ complete ทุกขั้นตอนพร้อมกัน ทำให้ timming ทำงานไหล่เหลี่ยต่อๆกัน
 
### Use of AI-Assisted Tools

ใช้ **Claude Code** (Anthropic) ตลอดการพัฒนาในงานต่อไปนี้:

- **Database schema design** — iterate Prisma schema, state machine transitions และ resource restoration semantics
- **Code generation** — API route handlers, server actions และ UI components ตาม convention ของ project
- **Debugging and code review** — ตรวจจับ logic errors, review guard clauses และยืนยันความถูกต้องของ transaction

การตัดสินใจด้าน architecture, ขอบเขตกำหนดงาน modelling (กระดาษ A4) และการ review ขั้นสุดท้ายทำโดย developer

---

## Local Setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (or [Supabase](https://supabase.com) free tier)

### Steps

```bash
git clone https://github.com/Jetanin-Sangchut/nextjs-mfg-tracker.git
cd nextjs-mfg-tracker
npm install
```

Copy `.env.example` to `.env` and fill in your database URLs:

```
DATABASE_URL="postgresql://..."   # transaction-mode pooler (pgbouncer=true)
DIRECT_URL="postgresql://..."     # session-mode pooler (for migrations)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_SECRET="<random-hex>"       # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Push schema and seed data:

```bash
npm run db:push
npm run db:seed
```

Start dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API

Postman collection อยู่ที่ `mfg-tracker.postman_collection.json`

Base URL: `http://localhost:3000/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/steps` | All steps ordered by sequence |
| GET | `/resources` | All resources with available qty |
| GET | `/orders` | List all orders with current step |
| GET | `/orders/:id` | Single order with step logs and resource consumptions |
| GET | `/orders/:id/logs` | Full transaction log (steps + resources nested) |
| GET | `/resource-logs?orderId=` | All resource consumptions; filter by orderId |
| POST | `/orders/submit` | Create order and deduct resources |
| POST | `/orders/:id/advance` | Complete current step, move to next |
| POST | `/orders/:id/approve` | Batch-complete all steps |
| POST | `/orders/:id/reject` | Operator reject (PENDING only) |
| POST | `/orders/:id/cancel` | Operator cancel (PENDING only) |
| POST | `/orders/:id/customer-reject` | Customer reject after COMPLETED |
| POST | `/resource-logs` | Manually log resource to active step |
