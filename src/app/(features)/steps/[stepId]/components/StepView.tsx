"use client"

import { type Order, type Step, type ResourceConsumption, RESOURCE_TYPE } from "../../../orders/types/order"
import { ResourceLogForm } from "../../../orders/components/ResourceLogForm"
import { cn } from "@/lib/utils"

type Props = {
  step: Step
  orders: Array<Order & {
    orderStepLogs: Array<{
      id: string
      status: string
      resourceConsumptions: ResourceConsumption[]
    }>
  }>
  resources: Array<{ id: string; name: string; unit: string; type: RESOURCE_TYPE; availableQty: number }>
}

export function StepView({ step, orders, resources }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{step.name}</h1>
        {step.description && (
          <p className="mt-1 text-sm text-zinc-500">{step.description}</p>
        )}
        <p className="mt-1 text-xs text-zinc-400">
          Step {step.sequenceOrder} · {orders.length} order{orders.length !== 1 ? "s" : ""} in progress
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          No orders currently at this step.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const activeLog = order.orderStepLogs.find((l) => l.status === "IN_PROGRESS")

            return (
              <div
                key={order.id}
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold text-zinc-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-zinc-600">{order.productName}</p>
                    <p className="text-xs text-zinc-400">Qty: {order.qty}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    In Progress
                  </span>
                </div>

                {activeLog && (
                  <>
                    {activeLog.resourceConsumptions.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                          Resources Used
                        </p>
                        <div className="space-y-1">
                          {activeLog.resourceConsumptions.map((rc) => (
                            <div
                              key={rc.id}
                              className={cn(
                                "flex items-center justify-between rounded px-3 py-1.5 text-sm",
                                "bg-zinc-50 text-zinc-700"
                              )}
                            >
                              <span>{rc.resource.name}</span>
                              <span className="font-medium">
                                {rc.qtyUsed} {rc.resource.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                        Log Resource
                      </p>
                      <ResourceLogForm
                        orderStepLogId={activeLog.id}
                        resources={resources}
                      />
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
