// Re-export Prisma enums under project naming convention
// Using Prisma's own types avoids nominal type mismatch in Server Actions
import { OrderStatus as ORDER_STATUS, StepLogStatus as STEP_LOG_STATUS, ResourceType as RESOURCE_TYPE } from "@prisma/client"
export { ORDER_STATUS, STEP_LOG_STATUS, RESOURCE_TYPE }

export type Step = {
  id: string
  name: string
  sequenceOrder: number
  description: string | null
}

export type Resource = {
  id: string
  name: string
  unit: string
  type: RESOURCE_TYPE
  availableQty: number
}

export type Order = {
  id: string
  orderNumber: string
  productName: string
  qty: number
  status: ORDER_STATUS
  currentStepId: string | null
  createdAt: Date
  currentStep: Step | null
}

export type OrderStepLog = {
  id: string
  orderId: string
  stepId: string
  status: STEP_LOG_STATUS
  startedAt: Date
  completedAt: Date | null
  step: Step
}

export type ResourceConsumption = {
  id: string
  orderStepLogId: string
  resourceId: string
  qtyUsed: number
  resource: Resource
}

export type ResourceEntry = {
  resourceId: string
  qty: number
}

export type StepResourceValues = {
  materials: ResourceEntry[]
  machines: ResourceEntry[]
  labourHours: number
}

export type ResourceState = Record<number, StepResourceValues>
