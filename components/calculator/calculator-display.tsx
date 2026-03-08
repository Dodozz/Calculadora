"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Copy, Check } from "lucide-react"

interface CalculatorDisplayProps {
  value: string
  expression: string
  hasMemory: boolean
  error: string | null
  isRadians: boolean
}

export function CalculatorDisplay({
  value,
  expression,
  hasMemory,
  error,
  isRadians,
}: CalculatorDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [value])

  const displaySize = value.length > 12 ? "text-2xl" : value.length > 8 ? "text-4xl" : "text-5xl"
  const isError = error !== null || value === "Error" || value === "∞" || value === "-∞"

  return (
    <div className="relative p-4 pb-6">
      {/* Status indicators */}
      <div className="absolute top-3 left-4 flex items-center gap-3">
        <span className="text-[10px] font-medium tracking-widest text-muted-foreground/50 uppercase">
          Calc Pro
        </span>
        
        {hasMemory && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-medium text-accent/70">M</span>
          </div>
        )}
        
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded",
          isRadians 
            ? "bg-primary/20 text-primary/80" 
            : "bg-muted text-muted-foreground/70"
        )}>
          {isRadians ? "RAD" : "DEG"}
        </span>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-3 right-4 p-1.5 rounded-lg",
          "text-muted-foreground/40 hover:text-muted-foreground/70",
          "hover:bg-muted/30 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/30"
        )}
        title="Copiar resultado"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-accent" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Expression */}
      <div className="mt-6 min-h-[1.5rem] text-right">
        <span className={cn(
          "text-sm text-muted-foreground/60 font-light tracking-wide",
          "animate-slide-up"
        )}>
          {expression}
        </span>
      </div>

      {/* Main display */}
      <div className="mt-1 text-right">
        <span
          className={cn(
            "display-number font-light tracking-tight",
            displaySize,
            isError 
              ? "text-destructive animate-shake" 
              : "text-foreground",
            "transition-all duration-200"
          )}
          style={{
            textShadow: isError 
              ? "0 0 30px rgba(239, 68, 68, 0.4)" 
              : "0 0 40px rgba(139, 92, 246, 0.25)"
          }}
        >
          {value}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-1 right-4 animate-slide-up">
          <span className="text-xs text-destructive/70">{error}</span>
        </div>
      )}

      {/* Decorative line */}
      <div className="absolute bottom-0 inset-x-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div 
          className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer"
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>
    </div>
  )
}
