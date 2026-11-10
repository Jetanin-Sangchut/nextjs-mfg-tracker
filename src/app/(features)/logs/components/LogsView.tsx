"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

type StepLog = {
  id: string
  status: string
  actionNote: string | null
  startedAt: Date
  completedAt: Date | null
  order: { id: string; orderNumber: string; productName: string }
  step: { id: string; name: string; sequenceOrder: number }
}

type ResourceLog = {
  id: string
  qtyUsed: number
  createdAt: Date
  resource: { id: string; name: string; unit: string; type: string }
  orderStepLog: {
    order: { id: string; orderNumber: string }
    step: { id: string; name: string }
  }
}

type Column<T> = { header: string; cell: (row: T) => ReactNode }

type Props = { stepLogs: StepLog[]; resourceLogs: ResourceLog[] }

const PAGE_SIZE = 10

function fmt(date: Date | string | null): string {
  if (!date) return "—"
  return new Date(date).toISOString().slice(0, 19).replace("T", " ")
}

function paginate<T>(items: T[], page: number) {
  const total = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const sliced = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return { sliced, total }
}

function PaginationBar({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null

  const pages: (number | "…")[] = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("…")
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i)
    if (page < total - 2) pages.push("…")
    pages.push(total)
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); if (page > 1) onChange(page - 1) }}
            aria-disabled={page === 1}
            className={cn(page === 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
        {pages.map((p, i) =>
          p === "…" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => { e.preventDefault(); onChange(p as number) }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); if (page < total) onChange(page + 1) }}
            aria-disabled={page === total}
            className={cn(page === total && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function ConfigTable<T extends { id: string }>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  if (rows.length === 0) {
    return <div className="flex items-center justify-center py-16 text-zinc-400">No logs yet.</div>
  }
  return (
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
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50">
              {columns.map((c) => c.cell(row))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const STEP_LOG_COLUMNS: Column<StepLog>[] = [
  { header: "Order #", cell: (r) => <td key="on" className="px-4 py-3 font-mono font-medium text-zinc-900">{r.order.orderNumber}</td> },
  { header: "Product", cell: (r) => <td key="pn" className="px-4 py-3 text-zinc-700">{r.order.productName}</td> },
  { header: "Step", cell: (r) => <td key="st" className="px-4 py-3 text-zinc-700">{r.step.name}</td> },
  { header: "Status", cell: (r) => (
    <td key="ss" className="px-4 py-3">
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        r.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
      )}>
        {r.status === "IN_PROGRESS" ? "In Progress" : "Completed"}
      </span>
    </td>
  )},
  { header: "Note", cell: (r) => <td key="an" className="px-4 py-3 text-zinc-500">{r.actionNote ?? "—"}</td> },
  { header: "Started", cell: (r) => <td key="sa" className="px-4 py-3 text-zinc-500">{fmt(r.startedAt)}</td> },
  { header: "Completed", cell: (r) => <td key="ca" className="px-4 py-3 text-zinc-500">{fmt(r.completedAt)}</td> },
]

const RESOURCE_LOG_COLUMNS: Column<ResourceLog>[] = [
  { header: "Resource", cell: (r) => <td key="rn" className="px-4 py-3 font-medium text-zinc-900">{r.resource.name}</td> },
  { header: "Type", cell: (r) => (
    <td key="rt" className="px-4 py-3">
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        r.resource.type === "MATERIAL" ? "bg-amber-100 text-amber-700"
        : r.resource.type === "MACHINE" ? "bg-purple-100 text-purple-700"
        : "bg-cyan-100 text-cyan-700"
      )}>
        {r.resource.type}
      </span>
    </td>
  )},
  { header: "Qty Used", cell: (r) => <td key="qu" className="px-4 py-3 text-zinc-700">{r.qtyUsed} {r.resource.unit}</td> },
  { header: "Order #", cell: (r) => <td key="ron" className="px-4 py-3 font-mono text-zinc-900">{r.orderStepLog.order.orderNumber}</td> },
  { header: "Step", cell: (r) => <td key="rsn" className="px-4 py-3 text-zinc-700">{r.orderStepLog.step.name}</td> },
  { header: "Logged At", cell: (r) => <td key="la" className="px-4 py-3 text-zinc-500">{fmt(r.createdAt)}</td> },
]

export function LogsView({ stepLogs, resourceLogs }: Props) {
  const [stepPage, setStepPage] = useState(1)
  const [resourcePage, setResourcePage] = useState(1)

  const { sliced: stepSliced, total: stepTotal } = paginate(stepLogs, stepPage)
  const { sliced: resourceSliced, total: resourceTotal } = paginate(resourceLogs, resourcePage)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Logs</h1>
      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">Step Logs ({stepLogs.length})</TabsTrigger>
          <TabsTrigger value="resources">Resource Logs ({resourceLogs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="steps" className="mt-4 space-y-2">
          <ConfigTable columns={STEP_LOG_COLUMNS} rows={stepSliced} />
          <PaginationBar page={stepPage} total={stepTotal} onChange={setStepPage} />
        </TabsContent>
        <TabsContent value="resources" className="mt-4 space-y-2">
          <ConfigTable columns={RESOURCE_LOG_COLUMNS} rows={resourceSliced} />
          <PaginationBar page={resourcePage} total={resourceTotal} onChange={setResourcePage} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
