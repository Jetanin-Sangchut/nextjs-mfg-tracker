"use client"

import { useForm } from "react-hook-form"
import Swal from "sweetalert2"
import { logResourceUsage } from "../actions/resource.actions"
import { type Resource } from "../types/order"

type FormValues = {
  resourceId: string
  qty: number
}

type Props = {
  orderStepLogId: string
  resources: Resource[]
}

export function ResourceLogForm({ orderStepLogId, resources }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (values: FormValues) => {
    const formData = new FormData()
    formData.set("orderStepLogId", orderStepLogId)
    formData.set("resourceId", values.resourceId)
    formData.set("qty", String(values.qty))

    const result = await logResourceUsage(formData)

    if (result?.error) {
      Swal.fire({ icon: "error", title: "Error", text: result.error })
      return
    }

    Swal.fire({ icon: "success", title: "Logged!", timer: 1200, showConfirmButton: false })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-zinc-600">Resource</label>
        <select
          {...register("resourceId", { required: "Select a resource" })}
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none"
        >
          <option value="">— select —</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.unit})
            </option>
          ))}
        </select>
        {errors.resourceId && (
          <p className="mt-0.5 text-xs text-red-500">{errors.resourceId.message}</p>
        )}
      </div>

      <div className="w-28">
        <label className="block text-xs font-medium text-zinc-600">Qty</label>
        <input
          type="number"
          step="0.01"
          min={0.01}
          {...register("qty", {
            required: "Required",
            min: { value: 0.01, message: "Must be > 0" },
            valueAsNumber: true,
          })}
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none"
          placeholder="0"
        />
        {errors.qty && (
          <p className="mt-0.5 text-xs text-red-500">{errors.qty.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isSubmitting ? "..." : "Log"}
      </button>
    </form>
  )
}
