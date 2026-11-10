"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { restoreWorkerResources } from "@/lib/restore-resources"
import { ORDER_STATUS } from "../types/order"

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

  await prisma.$transaction(async (tx) => {
    if (order.currentStepId) {
      const currentLog = await tx.orderStepLog.findFirst({
        where: { orderId, stepId: order.currentStepId, status: "IN_PROGRESS" },
        include: { resourceConsumptions: { include: { resource: true } } },
      })
      if (currentLog) {
        await tx.orderStepLog.update({
          where: { id: currentLog.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        })
        await restoreWorkerResources(tx, currentLog.resourceConsumptions)
      }
    }

    if (nextStep) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.IN_PROGRESS, currentStepId: nextStep.id },
      })
      await tx.orderStepLog.create({
        data: { orderId, stepId: nextStep.id, status: "IN_PROGRESS", actionNote: `Moved to ${nextStep.name}` },
      })
    } else {
      await tx.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.COMPLETED, currentStepId: order.currentStepId },
      })
    }
  })

  revalidatePath("/orders")
  revalidatePath("/dashboard")
  if (nextStep) revalidatePath(`/steps/${nextStep.id}`)
  return { success: true, completed: !nextStep, stepName: nextStep?.name ?? null }
}
