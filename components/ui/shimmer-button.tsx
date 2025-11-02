"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ButtonProps } from "@/components/ui/button"

export interface ShimmerButtonProps extends ButtonProps {
  shimmerDuration?: string
  className?: string
  children?: React.ReactNode
}

export function ShimmerButton({
  shimmerDuration = "3s",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <Button
      className={cn(
        "relative overflow-hidden whitespace-nowrap bg-zinc-900 border border-zinc-700 text-white",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_3s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </Button>
  )
}

