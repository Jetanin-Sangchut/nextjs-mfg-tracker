"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { STEP_LOG_STATUS } from "../types/order"

export async function logResourceUsage(formData: FormData) {
  const orderStepLogId = formData.get("orderStepLogId") as string
  const resourceId = formData.get("resourceId") as string
  const qtyRaw = formData.get("qty") as string

  if (!orderStepLogId) return { error: "Order step log ID is required" }
  if (!resourceId) return { error: "Resource is required" }

  const qty = parseFloat(qtyRaw)
  if (isNaN(qty) || qty <= 0) return { error: "Quantity must be greater than 0" }

  const stepLog = await prisma.orderStepLog.findUnique({
    where: { id: orderStepLogId },
  })

  if (!stepLog) return { error: "Step log not found" }
  if (stepLog.status === STEP_LOG_STATUS.COMPLETED) return { error: "Cannot log resources for a completed step" }

  await prisma.resourceConsumption.create({
    data: { orderStepLogId, resourceId, qtyUsed: qty },
  })

  revalidatePath(`/orders`)
  revalidatePath(`/steps/${stepLog.stepId}`)
  return { success: true }
}
