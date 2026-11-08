import { PrismaClient, ResourceType } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // ─── Wipe in FK order (fact → dimension) ─────────────────────────────────
  await prisma.resourceConsumption.deleteMany()
  await prisma.orderStepLog.deleteMany()
  await prisma.order.deleteMany()
  await prisma.step.deleteMany()
  await prisma.resource.deleteMany()

  // ─── Steps (dimensions) ───────────────────────────────────────────────────
  await prisma.step.createMany({
    data: [
      {
        name: "Preparing",
        sequenceOrder: 1,
        description:
          "Paper cutting: raw paper bundle fed into cutting machine → output A4 sheets (210×297mm)",
      },
      {
        name: "Processing",
        sequenceOrder: 2,
        description:
          "Weighing and sorting to 500g per ream; wrap ream in moisture-barrier film using wrapping tools",
      },
      {
        name: "Packaging",
        sequenceOrder: 3,
        description:
          "C.1 Print label (printing machine, concurrent: brand + weight) → apply to ream. C.2 Boxing: human-loaded, automate-sealed. C.3 Quality inspection: human verifies C.1+C.2 output",
      },
    ],
  })

  // ─── Resources (dimensions) ───────────────────────────────────────────────
  await prisma.resource.createMany({
    data: [
      { name: "Paper Bundle",     unit: "kg",      type: ResourceType.MATERIAL },
      { name: "Wrapping Film",    unit: "meters",  type: ResourceType.MATERIAL },
      { name: "Carton Box",       unit: "units",   type: ResourceType.MATERIAL },
      { name: "Cutting Machine",  unit: "hours",   type: ResourceType.MACHINE  },
      { name: "Wrapping Tools",   unit: "hours",   type: ResourceType.MACHINE  },
      { name: "Printing Machine", unit: "hours",   type: ResourceType.MACHINE  },
      { name: "Labour",           unit: "hours",   type: ResourceType.LABOUR   },
    ],
  })

  console.log("Seed complete: 3 steps, 7 resources")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
