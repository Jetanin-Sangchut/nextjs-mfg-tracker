"use client"

import { type Order } from "../../orders/types/order"
import { ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from "@/lib/order-status"
import { cn } from "@/lib/utils"

type Props = {
  orders: Order[]
}

export function DashboardView({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        No orders yet. Create one to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Order #</th>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Qty</th>
            <th className="px-4 py-3 font-medium">Current Step</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
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
              <td className="px-4 py-3 text-zinc-400">
                {new Date(order.createdAt).toLocaleDateString("en-GB")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
