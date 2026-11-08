"use client"

import { useForm } from "react-hook-form"
import Swal from "sweetalert2"
import { createOrder } from "../actions/order.actions"

type FormValues = {
  orderNumber: string
  productName: string
  qty: number
}

type Props = {
  onSuccess: () => void
}

export function OrderForm({ onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (values: FormValues) => {
    const formData = new FormData()
    formData.set("orderNumber", values.orderNumber)
    formData.set("productName", values.productName)
    formData.set("qty", String(values.qty))

    const result = await createOrder(formData)

    if (result?.error) {
      Swal.fire({ icon: "error", title: "Error", text: result.error })
      return
    }

    Swal.fire({
      icon: "success",
      title: "Order created!",
      timer: 1500,
      showConfirmButton: false,
    })
    reset()
    onSuccess()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Order Number
        </label>
        <input
          {...register("orderNumber", { required: "Order number is required" })}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          placeholder="e.g. ORD-001"
        />
        {errors.orderNumber && (
          <p className="mt-1 text-xs text-red-500">
            {errors.orderNumber.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Product Name
        </label>
        <input
          {...register("productName", { required: "Product name is required" })}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          placeholder="e.g. Steel Frame Type A"
        />
        {errors.productName && (
          <p className="mt-1 text-xs text-red-500">
            {errors.productName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Quantity
        </label>
        <input
          type="number"
          min={1}
          {...register("qty", {
            required: "Quantity is required",
            min: { value: 1, message: "Must be at least 1" },
            valueAsNumber: true,
          })}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          placeholder="1"
        />
        {errors.qty && (
          <p className="mt-1 text-xs text-red-500">{errors.qty.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create Order"}
      </button>
    </form>
  )
}
