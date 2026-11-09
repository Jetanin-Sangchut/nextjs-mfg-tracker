import { ResourceType } from "@prisma/client"
import type { ResourceConsumption, Resource } from "@prisma/client"
import { prisma } from "@/lib/db"

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
type ConsumptionWithResource = ResourceConsumption & { resource: Resource }

export async function restoreWorkerResources(
  tx: TransactionClient,
  consumptions: ConsumptionWithResource[]
) {
  for (const c of consumptions) {
    if (c.resource.type !== ResourceType.MACHINE && c.resource.type !== ResourceType.LABOUR) continue
    await tx.resource.update({
      where: { id: c.resourceId },
      data: { availableQty: { increment: c.qtyUsed } },
    })
  }
}
