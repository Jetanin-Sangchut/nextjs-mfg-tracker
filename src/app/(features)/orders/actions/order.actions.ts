"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { ORDER_STATUS, STEP_LOG_STATUS } from "../types/order"

export async function createOrder(formData: FormData) {
  const orderNumber = (formData.get("orderNumber") as string)?.trim()
  const productName = (formData.get("productName") as string)?.trim()
  const qtyRaw = formData.get("qty") as string

  if (!orderNumber) return { error: "Order number is required" }
  if (!productName) return { error: "Product name is required" }

  const qty = parseInt(qtyRaw, 10)
  if (isNaN(qty) || qty < 1) return { error: "Quantity must be at least 1" }

  const existing = await prisma.order.findUnique({ where: { orderNumber } })
  if (existing) return { error: `Order number "${orderNumber}" already exists` }

  await prisma.order.create({
    data: { orderNumber, productName, qty, status: ORDER_STATUS.PENDING },
  })

  revalidatePath("/orders")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function advanceOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { currentStep: true },
  })

  if (!order) return { error: "Order not found" }
  if (order.status === ORDER_STATUS.COMPLETED) return { error: "Order is already completed" }

  const steps = await prisma.step.findMany({ orderBy: { sequenceOrder: "asc" } })
  if (steps.length === 0) return { error: "No steps configured" }

  const currentSeq = order.currentStep?.sequenceOrder ?? 0
  const nextStep = steps.find(({ sequenceOrder }) => sequenceOrder > currentSeq)

  // Complete current step log if exists
  if (order.currentStepId) {
    await prisma.orderStepLog.updateMany({
      where: { orderId, stepId: order.currentStepId, status: STEP_LOG_STATUS.IN_PROGRESS },
      data: { status: "COMPLETED", completedAt: new Date() },
    })
  }

  // No next step — order is fully complete
  if (!nextStep) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.COMPLETED, currentStepId: null },
    })
    revalidatePath("/orders")
    revalidatePath("/dashboard")
    return { success: true, completed: true }
  }

  // Advance to next step
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.IN_PROGRESS, currentStepId: nextStep.id },
    }),
    prisma.orderStepLog.create({
      data: { orderId, stepId: nextStep.id, status: STEP_LOG_STATUS.IN_PROGRESS, actionNote: `Moved to ${nextStep.name}` },
    }),
  ])

  revalidatePath("/orders")
  revalidatePath("/dashboard")
  revalidatePath(`/steps/${nextStep.id}`)
  return { success: true, completed: false, stepName: nextStep.name }
}
