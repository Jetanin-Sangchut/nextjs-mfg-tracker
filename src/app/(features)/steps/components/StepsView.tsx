"use client"

import Link from "next/link"
import type { Step } from "../../orders/types/order"

type Props = {
  steps: Step[]
}

export function StepsView({ steps }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Production Steps</h1>
      <table className="w-full border-collapse bg-white shadow rounded">
        <thead>
          <tr className="bg-zinc-100 text-left text-sm text-zinc-600">
            <th className="px-4 py-3 border-b">Seq</th>
            <th className="px-4 py-3 border-b">Name</th>
            <th className="px-4 py-3 border-b">Description</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.id} className="hover:bg-zinc-50 text-sm">
              <td className="px-4 py-3 border-b text-zinc-500">{step.sequenceOrder}</td>
              <td className="px-4 py-3 border-b">
                <Link href={`/steps/${step.id}`} className="text-blue-600 hover:underline font-medium">
                  {step.name}
                </Link>
              </td>
              <td className="px-4 py-3 border-b text-zinc-500">{step.description ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
