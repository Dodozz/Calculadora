"use client"

import { cn } from "@/lib/utils"
import { History, Trash2, X } from "lucide-react"
import type { HistoryEntry } from "@/lib/calculator"

interface CalculatorHistoryProps {
  history: HistoryEntry[]
  onSelectResult: (result: string) => void
  onClearHistory: () => void
  isOpen: boolean
  onClose: () => void
}

export function CalculatorHistory({
  history,
  onSelectResult,
  onClearHistory,
  isOpen,
  onClose,
}: CalculatorHistoryProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-50 animate-slide-up">
      <div className="absolute inset-0 glass rounded-[2rem]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <History className="w-4 h-4" />
            <span className="text-sm font-medium">Historial</span>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className={cn(
                  "p-2 rounded-lg text-muted-foreground/60",
                  "hover:text-destructive hover:bg-destructive/10",
                  "transition-colors duration-200"
                )}
                title="Limpiar historial"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg text-muted-foreground/60",
                "hover:text-foreground hover:bg-muted/30",
                "transition-colors duration-200"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History list */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
              <History className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Sin historial</p>
              <p className="text-xs mt-1">Tus cálculos aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((entry, index) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    onSelectResult(entry.result)
                    onClose()
                  }}
                  className={cn(
                    "w-full p-3 rounded-xl text-right",
                    "hover:bg-muted/30 transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30",
                    "group"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="text-xs text-muted-foreground/50 mb-1 group-hover:text-muted-foreground/70 transition-colors">
                    {entry.expression}
                  </div>
                  <div className="display-number text-lg text-foreground group-hover:text-primary transition-colors">
                    {entry.result}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
