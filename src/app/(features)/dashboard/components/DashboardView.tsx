"use client"

import type { ReactNode } from "react"
import { type Order, type Resource } from "../../orders/types/order"
import { ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from "@/lib/order-status"
import { cn } from "@/lib/utils"

type Props = { orders: Order[]; resources: Resource[] }

type OrderColumn = { header: string; cell: (o: Order) => ReactNode }
type ResourceColumn = { header: string; cell: (r: Resource) => ReactNode }

const ORDER_COLUMNS: OrderColumn[] = [
  { header: "Order #",      cell: (o) => <td key="n" className="px-4 py-3 font-mono font-medium text-zinc-900">{o.orderNumber}</td> },
  { header: "Product",      cell: (o) => <td key="p" className="px-4 py-3 text-zinc-700">{o.productName}</td> },
  { header: "Qty",          cell: (o) => <td key="q" className="px-4 py-3 text-zinc-700">{o.qty}</td> },
  { header: "Current Step", cell: (o) => <td key="s" className="px-4 py-3 text-zinc-700">{o.currentStep?.name ?? "—"}</td> },
  { header: "Status", cell: (o) => (
    <td key="st" className="px-4 py-3">
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", ORDER_STATUS_CLASS[o.status] ?? "bg-zinc-100 text-zinc-700")}>
        {ORDER_STATUS_LABEL[o.status] ?? o.status}
      </span>
    </td>
  )},
  { header: "Created", cell: (o) => <td key="c" className="px-4 py-3 text-zinc-400">{new Date(o.createdAt).toLocaleDateString("en-GB")}</td> },
]

const RESOURCE_COLUMNS: ResourceColumn[] = [
  { header: "Name",          cell: (r) => <td key="n" className="px-4 py-3 font-medium text-zinc-900">{r.name}</td> },
  { header: "Type", cell: (r) => (
    <td key="t" className="px-4 py-3">
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        r.type === "MATERIAL" ? "bg-amber-100 text-amber-700"
        : r.type === "MACHINE" ? "bg-purple-100 text-purple-700"
        : "bg-cyan-100 text-cyan-700"
      )}>
        {r.type}
      </span>
    </td>
  )},
  { header: "Available Qty", cell: (r) => <td key="q" className="px-4 py-3 text-zinc-700">{r.availableQty}</td> },
  { header: "Unit",          cell: (r) => <td key="u" className="px-4 py-3 text-zinc-500">{r.unit}</td> },
]

function ConfigTable<T extends { id: string }>({ columns, rows }: { columns: { header: string; cell: (r: T) => ReactNode }[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
          <tr>{columns.map((c) => <th key={c.header} className="px-4 py-3 font-medium">{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50">
              {columns.map((c) => c.cell(row))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardView({ orders, resources }: Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-base font-medium text-zinc-700">Orders</h2>
        {orders.length === 0
          ? <div className="flex items-center justify-center py-12 text-zinc-400">No orders yet.</div>
          : <ConfigTable columns={ORDER_COLUMNS} rows={orders} />
        }
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-zinc-700">Resources</h2>
        {resources.length === 0
          ? <div className="flex items-center justify-center py-12 text-zinc-400">No resources configured.</div>
          : <ConfigTable columns={RESOURCE_COLUMNS} rows={resources} />
        }
      </section>
    </div>
  )
}
