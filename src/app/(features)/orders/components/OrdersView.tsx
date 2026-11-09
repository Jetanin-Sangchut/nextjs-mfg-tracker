"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Swal from "sweetalert2"
import { type Order, type Step, type Resource } from "../types/order"
import { advanceOrder } from "../actions/order.actions"
import { OrderForm } from "./OrderForm"
import { ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from "@/lib/order-status"
import { cn } from "@/lib/utils"

type Props = {
  orders: Order[]
  steps: Step[]
  resources: Resource[]
}

const ORDER_ACTION: Record<string, "advance" | "new"> = {
  PENDING: "advance",
  IN_PROGRESS: "advance",
  COMPLETED: "new",
  REJECTED: "new",
  CANCELLED: "new",
  CUSTOMER_REJECTED: "new",
}

type Column = { header: string; cell: (o: Order) => ReactNode }

export function OrdersView({ orders, steps, resources }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [advancing, setAdvancing] = useState<string | null>(null)

  const handleAdvance = async (orderId: string) => {
    setAdvancing(orderId)
    const result = await advanceOrder(orderId)
    setAdvancing(null)

    if (result?.error) {
      Swal.fire({ icon: "error", title: "Error", text: result.error })
      return
    }

    const title = result?.completed ? "Order completed!" : `Moved to: ${result?.stepName}`
    Swal.fire({ icon: "success", title, timer: 1500, showConfirmButton: false })
  }

  const columns: Column[] = [
    { header: "Order #", cell: (o) => <td key="n" className="px-4 py-3 font-mono font-medium text-zinc-900">{o.orderNumber}</td> },
    { header: "Product", cell: (o) => <td key="p" className="px-4 py-3 text-zinc-700">{o.productName}</td> },
    { header: "Qty", cell: (o) => <td key="q" className="px-4 py-3 text-zinc-700">{o.qty}</td> },
    { header: "Current Step", cell: (o) => <td key="s" className="px-4 py-3 text-zinc-700">{o.currentStep?.name ?? "—"}</td> },
    { header: "Status", cell: (o) => (
      <td key="st" className="px-4 py-3">
        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", ORDER_STATUS_CLASS[o.status] ?? "bg-zinc-100 text-zinc-700")}>
          {ORDER_STATUS_LABEL[o.status] ?? o.status}
        </span>
      </td>
    )},
    { header: "Actions", cell: (o) => (
      <td key="a" className="px-4 py-3">
        {ORDER_ACTION[o.status] === "advance" && (
          <button
            onClick={() => handleAdvance(o.id)}
            disabled={advancing === o.id}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {advancing === o.id ? "Moving..." : "Advance →"}
          </button>
        )}
        {ORDER_ACTION[o.status] === "new" && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded bg-zinc-600 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-500"
          >
            + New Order
          </button>
        )}
      </td>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Orders</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          {showForm ? "Cancel" : "+ New Order"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-medium text-zinc-900">Create Order</h2>
          <OrderForm onSuccess={() => setShowForm(false)} steps={steps} resources={resources} />
        </div>
      )}

      {!showForm && orders.length === 0 && (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          No orders yet.
        </div>
      )}
      {!showForm && orders.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.header} className="px-4 py-3 font-medium">{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50">
                  {columns.map((c) => c.cell(order))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
