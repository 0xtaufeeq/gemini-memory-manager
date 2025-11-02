"use client"

import React, { useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export function MagicCard({
  children,
  className,
  gradientFrom = "from-blue-500",
  gradientTo = "to-purple-500",
  ...props
}: {
  children?: React.ReactNode
  className?: string
  gradientFrom?: string
  gradientTo?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePosition({ x, y })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "group relative flex size-full overflow-hidden rounded-xl border bg-black/50 backdrop-blur-md transition-shadow duration-300",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      
      {/* Animated gradient border */}
      <motion.div
        className={cn(
          "pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          `bg-gradient-to-r ${gradientFrom} ${gradientTo}`
        )}
        style={{
          maskImage: `radial-gradient(180px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(180px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
        }}
        animate={
          isHovering
            ? {
                maskImage: `radial-gradient(180px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
                WebkitMaskImage: `radial-gradient(180px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
              }
            : {
                maskImage: `radial-gradient(180px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
                WebkitMaskImage: `radial-gradient(180px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
              }
        }
        transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
      />
    </div>
  )
}

