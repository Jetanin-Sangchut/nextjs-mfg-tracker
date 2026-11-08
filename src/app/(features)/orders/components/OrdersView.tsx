"use client"

import { useState } from "react"
import Swal from "sweetalert2"
import { type Order } from "../types/order"
import { advanceOrder } from "../actions/order.actions"
import { OrderForm } from "./OrderForm"
import { ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from "@/lib/order-status"
import { cn } from "@/lib/utils"

type Props = {
  orders: Order[]
}

export function OrdersView({ orders }: Props) {
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

    if (result?.completed) {
      Swal.fire({ icon: "success", title: "Order completed!", timer: 1500, showConfirmButton: false })
    } else {
      Swal.fire({ icon: "success", title: `Moved to: ${result?.stepName}`, timer: 1500, showConfirmButton: false })
    }
  }

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
          <OrderForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Current Step</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono font-medium text-zinc-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{order.productName}</td>
                  <td className="px-4 py-3 text-zinc-700">{order.qty}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {order.currentStep?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        ORDER_STATUS_CLASS[order.status] ?? "bg-zinc-100 text-zinc-700"
                      )}
                    >
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleAdvance(order.id)}
                        disabled={advancing === order.id}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        {advancing === order.id ? "Moving..." : "Advance →"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
