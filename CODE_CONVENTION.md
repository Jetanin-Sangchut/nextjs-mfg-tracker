# Code Convention — nextjs-mfg-tracker

เอกสารนี้สรุปแนวทางการเขียนโค้ดที่ใช้จริงในโปรเจกต์นี้ เพื่อให้ทุกคนเขียนโค้ดไปในทิศทางเดียวกัน ถ้าจุดไหนในโค้ดจริงขัดกับเอกสารนี้ ให้ถือว่าเอกสารนี้คือเป้าหมายที่ควรปรับโค้ดเข้าหา ไม่ใช่ในทางกลับกัน

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Database**: Prisma 5 ORM → Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 + shadcn/ui + `cn()` helper
- **Forms**: react-hook-form (inline validation rules — ไม่ใช้ Zod)
- **Feedback**: SweetAlert2 (client components เท่านั้น)
- **Client state**: local `useState` เท่านั้น — ไม่มี Redux, ไม่มี TanStack Query

---

## 1. โครงสร้างโฟลเดอร์ (Feature-based)

โปรเจกต์จัดกลุ่มตาม **feature** ไม่ใช่ตาม type ของไฟล์ ทุกฟีเจอร์ภายใต้ `src/app/(features)/<feature>/`:

```
orders/
├── actions/
│   └── order.actions.ts    # "use server" — Server Actions เท่านั้น ไม่มี UI logic
├── components/
│   ├── OrdersView.tsx       # "use client" — ประกอบ UI + เรียก Server Actions
│   └── OrderForm.tsx        # "use client" — form component
├── types/
│   └── order.ts             # type ของ domain นี้
└── page.tsx                 # Server Component — thin (fetch ข้อมูล + render View)
```

กติกา:
- **`page.tsx` ต้อง thin เสมอ** — fetch ข้อมูลผ่าน Prisma แล้วส่ง props ให้ View component เท่านั้น ห้ามมี UI logic
- แต่ละฟีเจอร์เก็บ `actions/`, `types/`, `components/` ของตัวเอง — ห้ามเอา logic เฉพาะฟีเจอร์ไปแปะใน shared folder ยกเว้นใช้ร่วมกันจริงข้ามฟีเจอร์
- shared/reusable component ข้ามฟีเจอร์อยู่ที่ `src/components/`
- shadcn primitives (generated) อยู่ที่ `src/components/ui/` — อย่าแก้ logic เพิ่มเข้าไป ถ้าต้อง customize ให้ห่อ (wrap) แทน

---

## 2. Naming Conventions

| อะไร | Convention | ตัวอย่าง |
|---|---|---|
| Component file/export | PascalCase, ชื่อสื่อ role (View/Form/Filter/...) | `OrdersView.tsx`, `OrderForm.tsx` |
| Server Action file | `<feature>.actions.ts` | `order.actions.ts` |
| Types file | `<feature>.ts` | `order.ts` |
| Type/Interface names | PascalCase, ใช้ `type` เป็นหลัก | `Order`, `OrderCreateInput` |

Import path: ใช้ alias `@/*` (ชี้ไป `src/`) เช่น `@/lib/db`, `@/components/ui/button` — หลีกเลี่ยง relative path ยาวๆ ข้ามหลายระดับ ยกเว้นภายในฟีเจอร์เดียวกัน (`../actions/order.actions`) ซึ่งใช้ relative ได้ปกติ

---

## 3. TypeScript

- **strict mode เปิดอยู่** (`tsconfig.json`) — ห้ามใช้ `any` แบบไม่มีเหตุผล ถ้าจำเป็นต้อง cast ให้ cast แบบมีจุดเดียวชัดเจน ไม่กระจาย `any` ไปทั่วไฟล์
- ใช้ `type` แทน `interface` เป็นค่าเริ่มต้น ใช้ `interface` เฉพาะกรณีต้องการ declaration merging จริงๆ
- **ใช้ `const` ก่อนเสมอ ห้ามใช้ `let`** — ถ้าตัวแปรไม่มีการ re-assign ค่าใหม่ให้ประกาศเป็น `const` เสมอ `let` ใช้ได้เฉพาะกรณีที่ re-assign จริงและเลี่ยงไม่ได้เท่านั้น

  ```ts
  // ❌ ห้าม — ประกาศ let ทั้งที่ค่าไม่เคยถูก re-assign จริง
  let total = 0;
  total = items.reduce((sum, item) => sum + item.price, 0);

  let label;
  if (status === "ACTIVE") {
    label = "Active";
  } else {
    label = "Inactive";
  }

  // ✅ ใช้ const แทน
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const label = STATUS_LABEL[status] ?? "Unknown"; // ดู lookup table ในข้อ 9.6
  ```

- **ใช้ `enum` สำหรับกลุ่มค่าคงที่ (fixed set of values)** — ชื่อ enum และชื่อ member ใช้ `UPPER_SNAKE_CASE` เสมอ ส่วน **value** แยกกติกาตามที่มาของข้อมูล:
  - ค่าที่เป็น **frontend-only** → value เป็นตัวพิมพ์เล็ก
  - ค่าที่ **มาจาก DB** → value ต้องตรงกับที่ Prisma/DB ใช้เป๊ะๆ (`UPPER_SNAKE_CASE`)

  ```ts
  // ✅ มาจาก DB — value ตรงกับ Prisma enum
  enum ORDER_STATUS {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
  }

  const ORDER_STATUS_LABEL: Record<ORDER_STATUS, string> = {
    [ORDER_STATUS.PENDING]: "Pending",
    [ORDER_STATUS.IN_PROGRESS]: "In Progress",
    [ORDER_STATUS.COMPLETED]: "Completed",
  };
  ```

---

## 4. State Management

- **Server state (data จาก DB) → Server Components fetch ผ่าน Prisma โดยตรง** ห้ามใช้ `useState` + `useEffect` ยิง fetch เอง และห้ามใช้ TanStack Query
- **UI state ธรรมดา (dialog open/close, form input, loading indicator) → local `useState`** อยู่ใน component เดียว
- ไม่มี global store — ถ้า state ต้องการข้ามหลาย component ให้ lift state up หรือใช้ Server Component re-fetch

---

## 5. Data Layer — Server Actions

ทุกการเขียนข้อมูล (create/update/delete) ผ่าน **Server Actions** (`"use server"`) เท่านั้น — ไม่มี API routes สำหรับ internal data

```ts
// actions/<feature>.actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function create<Feature>(formData: FormData) {
  const name = (formData.get("<feature>_name") as string)?.trim()
  if (!name) return { error: "Name is required" }  // guard clause ก่อน

  await prisma.<feature>.create({ data: { name } })
  revalidatePath("/<feature>")
  return { success: true }
}
```

กติกา:
- Server Action ต้องมี `"use server"` ที่บรรทัดแรกของไฟล์
- ใช้ guard clause เช็ค input ก่อน Prisma call เสมอ
- เรียก `revalidatePath()` หลัง mutate เพื่อ revalidate Server Component cache
- ห้ามเรียก Prisma จาก Client Component โดยตรง

---

## 5b. SweetAlert2 — Client Feedback

ใช้ SweetAlert2 ใน `"use client"` component เท่านั้น (ต้องการ DOM/window)

```ts
import Swal from "sweetalert2"

// Success
Swal.fire({ icon: "success", title: "Done!", timer: 1500, showConfirmButton: false })

// Error (จาก Server Action return)
Swal.fire({ icon: "error", title: "Error", text: result.error })
```

---

## 6. Forms

ฟอร์มใช้ **react-hook-form** พร้อม inline validation rules ใน `register()` — ไม่ต้องแยกไฟล์ schema

```tsx
"use client"

import { useForm } from "react-hook-form"
import Swal from "sweetalert2"
import { create<Feature> } from "../actions/<feature>.actions"

type FormValues = { name: string; qty: number }

export function <Feature>Form() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>()

  const onSubmit = async (values: FormValues) => {
    const fd = new FormData()
    fd.set("name", values.name)
    fd.set("qty", String(values.qty))

    const result = await create<Feature>(fd)
    if (result?.error) {
      Swal.fire({ icon: "error", title: "Error", text: result.error })
      return
    }
    Swal.fire({ icon: "success", title: "Created!", timer: 1500, showConfirmButton: false })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("name", { required: "Name is required" })}
      />
      {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  )
}
```

ถ้า mapping logic (แปลง form values ↔ payload) ยาวเกิน 20 บรรทัด ให้แยกออกเป็น `<feature>-mapping.ts` sibling

---

## 7. Styling / UI

- ใช้ Tailwind utility classes ตรงๆ ใน JSX, รวม conditional classes ด้วย `cn()` จาก `src/lib/utils.ts` เสมอ อย่าต่อ string classNames เอง
- Component ที่ใช้ hook/interactivity ฝั่ง client ต้องมี `"use client"` ที่บรรทัดแรกของไฟล์
- ใช้ shadcn/ui component จาก `src/components/ui` เป็นฐาน ห้ามสร้าง component คู่ขนานที่ทำหน้าที่ซ้ำ

---

## 8. Code Quality

- **หลีกเลี่ยง nested if** — ใช้ guard clause (early return) หรือ lookup table แทนการซ้อน `if` หลายชั้น
- **ห้าม duplicate pattern ซ้ำในไฟล์เดียวกัน** — ถ้าเจอ logic/JSX ซ้ำ 3 จุดขึ้นไปในไฟล์เดียว ให้ดึงออกเป็นฟังก์ชัน/component ย่อย
- **ไม่มี trash code**: ไม่มี unused import/variable, ไม่มี commented-out code, ไม่มี debug `console.log`, ไม่มี dead branch
- ใช้ `eslint` (`npm run lint`) ก่อน commit เสมอ

---

## 9. Git / Commit

- Commit message ขึ้นต้นด้วย prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `revert:`
- Branch name: `<author>/<topic>` เช่น `jay/orders-feature`

---

## 10. Code Patterns (Template อ้างอิง)

เวลาเพิ่มฟีเจอร์ใหม่ให้ copy โครงจาก template ด้านล่างแล้วแทนที่ชื่อ

### 10.1 Types (`types/<feature>.ts`)

```ts
// types/<feature>.ts
export type <Feature> = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type <Feature>CreateInput = {
  name: string
}
```

### 10.2 Server Action (`actions/<feature>.actions.ts`)

```ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function create<Feature>(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "Name is required" }

  await prisma.<feature>.create({ data: { name } })
  revalidatePath("/<feature>")
  return { success: true }
}

export async function update<Feature>(id: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "Name is required" }
  if (!id) return { error: "ID is required" }

  await prisma.<feature>.update({ where: { id }, data: { name } })
  revalidatePath("/<feature>")
  return { success: true }
}
```

### 10.3 Server Component Page (`page.tsx`)

> **⚠️ Cache opt-out:** โปรเจกต์นี้ใช้ `nextConfig.cacheComponents` — ห้ามใช้ `export const dynamic = "force-dynamic"` จะ error ที่ build time ให้ใช้ `export const instant = false` แทนเสมอ

```tsx
// page.tsx — thin, fetch + pass props only
import { prisma } from "@/lib/db"
import { <Feature>View } from "./components/<Feature>View"

export const instant = false   // ← opt out of caching (ห้ามใช้ dynamic = "force-dynamic")

export default async function <Feature>Page() {
  const items = await prisma.<feature>.findMany({ orderBy: { createdAt: "desc" } })
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <<Feature>View items={items} />
    </main>
  )
}
```

### 10.4 Guard Clauses & Lookup Tables

ตามกติกาข้อ 8 ให้เลือกใช้ 2 เทคนิคนี้แทน nested if:

**Guard Clause** — เช็คเงื่อนไขที่ทำให้ฟังก์ชันจบก่อน แล้ว `return` ออกทันที

```ts
// ❌ ก่อน — nested if
function toDateOnly(value: string | null | undefined): string {
  if (value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    } else {
      const date = new Date(value);
      if (isValid(date)) {
        return format(date, "yyyy-MM-dd");
      } else {
        return "";
      }
    }
  } else {
    return "";
  }
}

// ✅ หลัง — guard clause, flat
function toDateOnly(value: string | null | undefined): string {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = new Date(value)
  return isValid(date) ? format(date, "yyyy-MM-dd") : ""
}
```

**Lookup Table (Map/Record)** — ใช้แทน `if/else if` หรือ `switch` ที่ mapping ค่าคงที่

```ts
// ❌ ก่อน — if/else if
function getStatusLabel(status: string): string {
  if (status === "PENDING") return "Pending";
  else if (status === "IN_PROGRESS") return "In Progress";
  else if (status === "COMPLETED") return "Completed";
  else return "Unknown";
}

// ✅ หลัง — lookup table
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
}

function getStatusLabel(status: string): string {
  return STATUS_LABEL[status] ?? "Unknown"
}
```

กติกา:
- เจอ `if` ซ้อนเกิน 1 ชั้น → guard clause ก่อนเสมอ
- เจอ `if/else if` ที่ทุก branch แค่ map ค่า A → ค่า B → เปลี่ยนเป็น lookup table ทันที
- lookup table ต้องมี fallback (`?? defaultValue`) ห้ามปล่อย `undefined` เงียบๆ

### 10.5 Component (View) + Page

- View component: `"use client"`, ประกอบ local UI state + เรียก Server Actions + render UI — ไม่เรียก Prisma โดยตรง
- Page: thin Server Component, ไม่มี logic

```tsx
// components/<Feature>View.tsx
"use client"

import { useState } from "react"
import Swal from "sweetalert2"
import { create<Feature> } from "../actions/<feature>.actions"
import { <Feature>Form } from "./<Feature>Form"
import type { <Feature> } from "../types/<feature>"

type Props = { items: <Feature>[] }

export function <Feature>View({ items }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900"><Feature>s</h1>
        <button onClick={() => setShowForm((v) => !v)} className="...">
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      {showForm && (
        <<Feature>Form onSuccess={() => setShowForm(false)} />
      )}

      {/* table or list of items */}
    </div>
  )
}
```

---

## หมายเหตุ

เอกสารนี้เป็น living document — เมื่อ pattern ในโค้ดจริงเปลี่ยน ให้อัปเดตไฟล์นี้พร้อมกับ commit ที่ทำให้เกิดการเปลี่ยนแปลงนั้น
