"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import Swal from "sweetalert2"
import { Stepper } from "@/components/ui/stepper"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Step, type Resource, type ResourceState, type StepResourceValues, RESOURCE_TYPE } from "../types/order"

type OrderInfoValues = {
  orderNumber: string
  productName: string
  qty: number
}

type Props = {
  onSuccess: () => void
  steps: Step[]
  resources: Resource[]
}

type ResourcePayloadEntry = { resourceId: string; stepSequence: number; qtyUsed: number }

const STEP_0 = { id: "order-info", name: "Order Info", sequenceOrder: 0, description: null }

function emptyStepResources(): StepResourceValues {
  return { materials: [], machines: [], labourHours: 0 }
}

type ResourcePickerProps = {
  label: string
  options: Resource[]
  picked: { resourceId: string }[]
  allResources: Resource[]
  placeholder: string
  onAdd: (id: string) => void
  onRemove: (id: string) => void
}

function ResourcePicker({ label, options, picked, allResources, placeholder, onAdd, onRemove }: ResourcePickerProps) {
  const pickedIds = new Set(picked.map((p) => p.resourceId))
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-700">{label}</label>
      {picked.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {picked.map((p) => {
            const res = allResources.find((r) => r.id === p.resourceId)
            return (
              <span key={p.resourceId} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {res?.name ?? p.resourceId}
                <button type="button" onClick={() => onRemove(p.resourceId)} className="text-zinc-400 hover:text-zinc-700" aria-label={`Remove ${res?.name}`}>
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}
      <Select value={null} onValueChange={(id) => { if (id) onAdd(id as string) }}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((r) => (
              <SelectItem key={r.id} value={r.id} disabled={pickedIds.has(r.id)}>
                {r.name}{r.unit ? ` (${r.availableQty} ${r.unit})` : ""}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function OrderForm({ onSuccess, steps, resources }: Props) {
  const allSteps = [STEP_0, ...steps]
  const stepperSteps = allSteps.map((s) => ({ id: s.id, label: s.name }))

  const [currentStep, setCurrentStep] = useState(0)
  const [orderInfo, setOrderInfo] = useState<OrderInfoValues | null>(null)
  const [resourceState, setResourceState] = useState<ResourceState>(
    () => Object.fromEntries(allSteps.slice(1).map((_, i) => [i + 1, emptyStepResources()]))
  )
  const [submitting, setSubmitting] = useState(false)

  const materials = resources.filter((r) => r.type === RESOURCE_TYPE.MATERIAL)
  const machines = resources.filter((r) => r.type === RESOURCE_TYPE.MACHINE)
  const labourResources = resources.filter((r) => r.type === RESOURCE_TYPE.LABOUR)

  const { register, handleSubmit, formState: { errors } } = useForm<OrderInfoValues>()

  function getStep(stepIndex: number) {
    return resourceState[stepIndex] ?? emptyStepResources()
  }

  function addResource(stepIndex: number, resourceId: string, field: "materials" | "machines") {
    setResourceState((prev) => {
      const current = prev[stepIndex] ?? emptyStepResources()
      return { ...prev, [stepIndex]: { ...current, [field]: [...current[field], { resourceId, qty: 1 }] } }
    })
  }

  function removeResource(stepIndex: number, resourceId: string, field: "materials" | "machines") {
    setResourceState((prev) => {
      const current = prev[stepIndex] ?? emptyStepResources()
      return { ...prev, [stepIndex]: { ...current, [field]: current[field].filter((m) => m.resourceId !== resourceId) } }
    })
  }

  function setLabourHours(stepIndex: number, hours: number) {
    setResourceState((prev) => {
      const current = prev[stepIndex] ?? emptyStepResources()
      return { ...prev, [stepIndex]: { ...current, labourHours: hours } }
    })
  }

  const handleNext = handleSubmit((values) => {
    setOrderInfo(values)
    setCurrentStep(1)
  })

  function handleStepNext() {
    setCurrentStep((prev) => Math.min(prev + 1, allSteps.length - 1))
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  async function handleFinalSubmit() {
    if (!orderInfo) return
    setSubmitting(true)

    const resourceEntries: ResourcePayloadEntry[] = []

    steps.forEach((step, i) => {
      const stepIndex = i + 1
      const stepData = resourceState[stepIndex]
      if (!stepData) return

      stepData.materials.forEach((m) => {
        resourceEntries.push({ resourceId: m.resourceId, stepSequence: step.sequenceOrder, qtyUsed: m.qty })
      })
      stepData.machines.forEach((m) => {
        resourceEntries.push({ resourceId: m.resourceId, stepSequence: step.sequenceOrder, qtyUsed: m.qty })
      })
      if (stepData.labourHours > 0 && labourResources.length > 0) {
        resourceEntries.push({ resourceId: labourResources[0].id, stepSequence: step.sequenceOrder, qtyUsed: stepData.labourHours })
      }
    })

    const res = await fetch("/api/orders/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: orderInfo.orderNumber,
        productName: orderInfo.productName,
        qty: orderInfo.qty,
        resources: resourceEntries,
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      Swal.fire({ icon: "error", title: "Error", text: (data as { error?: string }).error ?? "Failed to create order" })
      return
    }

    Swal.fire({ icon: "success", title: "Order created!", timer: 1500, showConfirmButton: false })
    onSuccess()
  }

  return (
    <div className="space-y-6">
      <Stepper steps={stepperSteps} currentStep={currentStep} />

      {currentStep === 0 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Order Number</label>
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              {...register("orderNumber", { required: "Order number is required" })}
            />
            {errors.orderNumber && <p className="mt-1 text-xs text-red-500">{errors.orderNumber.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Product Name</label>
            <input
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              {...register("productName", { required: "Product name is required" })}
            />
            {errors.productName && <p className="mt-1 text-xs text-red-500">{errors.productName.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Quantity</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              {...register("qty", {
                required: "Quantity is required",
                min: { value: 1, message: "Must be at least 1" },
                valueAsNumber: true,
              })}
            />
            {errors.qty && <p className="mt-1 text-xs text-red-500">{errors.qty.message}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
              Next →
            </button>
          </div>
        </form>
      )}

      {allSteps.slice(1).map((step, i) => {
        const stepIndex = i + 1
        if (currentStep !== stepIndex) return null

        const stepData = getStep(stepIndex)
        const isLast = stepIndex === allSteps.length - 1

        return (
          <div key={step.id} className="space-y-5">
            {step.description && <p className="text-sm text-zinc-500">{step.description}</p>}

            {materials.length > 0 && (
              <ResourcePicker
                label="Materials"
                options={materials}
                picked={stepData.materials}
                allResources={resources}
                placeholder="Add material…"
                onAdd={(id) => addResource(stepIndex, id, "materials")}
                onRemove={(id) => removeResource(stepIndex, id, "materials")}
              />
            )}

            {machines.length > 0 && (
              <ResourcePicker
                label="Machines"
                options={machines}
                picked={stepData.machines}
                allResources={resources}
                placeholder="Add machine…"
                onAdd={(id) => addResource(stepIndex, id, "machines")}
                onRemove={(id) => removeResource(stepIndex, id, "machines")}
              />
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Labour Hours</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={stepData.labourHours || ""}
                onChange={(e) => setLabourHours(stepIndex, parseFloat(e.target.value) || 0)}
                className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                ← Back
              </button>
              {isLast ? (
                <button
                  type="button"
                  onClick={() => void handleFinalSubmit()}
                  disabled={submitting}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create Order"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStepNext}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
