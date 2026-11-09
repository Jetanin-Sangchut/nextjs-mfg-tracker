"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type StepperStep = { id: string; label: string }

type StepperProps = {
  steps: StepperStep[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isActive = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <li key={step.id} className={cn("flex flex-col items-center", !isLast && "flex-1")}>
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isCompleted && "border-zinc-900 bg-zinc-900 text-white",
                    isActive && "border-zinc-900 bg-white text-zinc-900",
                    !isCompleted && !isActive && "border-zinc-300 bg-white text-zinc-400"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 transition-colors",
                      index < currentStep ? "bg-zinc-900" : "bg-zinc-200"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 max-w-[80px] text-center text-xs",
                  isActive ? "font-medium text-zinc-900" : "text-zinc-400"
                )}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
