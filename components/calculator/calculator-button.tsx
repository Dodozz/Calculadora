"use client"

import { useCallback, useRef } from "react"
import { cn } from "@/lib/utils"

interface CalculatorButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: "number" | "operator" | "function" | "equals" | "memory" | "scientific"
  isActive?: boolean
  isWide?: boolean
  className?: string
  disabled?: boolean
}

export function CalculatorButton({
  children,
  onClick,
  variant = "number",
  isActive = false,
  isWide = false,
  className,
  disabled = false,
}: CalculatorButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const ripple = document.createElement("span")
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255,255,255,0.3), transparent 60%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.5s ease-out forwards;
      pointer-events: none;
    `

    button.appendChild(ripple)
    setTimeout(() => ripple.remove(), 500)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    createRipple(e)
    onClick()
  }, [onClick, createRipple, disabled])

  const variantStyles = {
    number: cn(
      "bg-secondary/50 border-secondary/80 text-foreground",
      "hover:bg-secondary/70 hover:border-secondary",
      "shadow-lg shadow-black/20"
    ),
    operator: cn(
      "bg-primary/20 border-primary/30 text-primary-foreground",
      "hover:bg-primary/30 hover:border-primary/50",
      "shadow-lg shadow-primary/10",
      isActive && "bg-primary/50 border-primary/70 animate-pulse-glow"
    ),
    function: cn(
      "bg-muted/50 border-muted text-muted-foreground",
      "hover:bg-muted/70 hover:text-foreground",
      "shadow-lg shadow-black/20"
    ),
    equals: cn(
      "bg-gradient-to-br from-primary via-primary/80 to-blue-600",
      "border-primary/50 text-white font-semibold",
      "hover:from-primary/90 hover:to-blue-500",
      "shadow-xl shadow-primary/30 animate-gradient"
    ),
    memory: cn(
      "bg-accent/10 border-accent/20 text-accent",
      "hover:bg-accent/20 hover:border-accent/40",
      "text-xs font-medium"
    ),
    scientific: cn(
      "bg-orange-500/10 border-orange-500/20 text-orange-400",
      "hover:bg-orange-500/20 hover:border-orange-500/40",
      "text-xs font-medium"
    ),
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        "flex items-center justify-center",
        "font-medium transition-all duration-150",
        "btn-press no-select touch-feedback",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        isWide ? "col-span-2 h-14 px-6" : "h-14 w-14",
        variantStyles[variant],
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
      style={{
        fontSize: variant === "memory" || variant === "scientific" ? "0.75rem" : "1.125rem",
      }}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Top highlight */}
      <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </button>
  )
}
