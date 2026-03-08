"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { CalculatorButton } from "./calculator-button"
import { CalculatorDisplay } from "./calculator-display"
import { CalculatorHistory } from "./calculator-history"
import { 
  safeCalculate, 
  applyScientificFunction, 
  formatNumber, 
  parseDisplay,
  generateId,
  CONSTANTS,
  type Operation,
  type ScientificFunction,
  type HistoryEntry 
} from "@/lib/calculator"
import { History, ChevronDown, ChevronUp } from "lucide-react"

export function Calculator() {
  // Core state
  const [display, setDisplay] = useState("0")
  const [expression, setExpression] = useState("")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [currentOperator, setCurrentOperator] = useState<Operation>(null)
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memory state
  const [memory, setMemory] = useState<number>(0)

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Scientific mode state
  const [isScientificMode, setIsScientificMode] = useState(false)
  const [isRadians, setIsRadians] = useState(false)
  const [isSecondFunction, setIsSecondFunction] = useState(false)

  const calculatorRef = useRef<HTMLDivElement>(null)

  // Clear error after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Add history entry
  const addToHistory = useCallback((expr: string, result: string) => {
    const entry: HistoryEntry = {
      id: generateId(),
      expression: expr,
      result,
      timestamp: new Date(),
    }
    setHistory(prev => [entry, ...prev.slice(0, 49)])
  }, [])

  // Handle number input
  const handleNumber = useCallback((num: string) => {
    setError(null)
    if (shouldResetDisplay) {
      setDisplay(num)
      setShouldResetDisplay(false)
    } else if (display === "0" && num !== ".") {
      setDisplay(num)
    } else if (display.length < 15) {
      setDisplay(prev => prev + num)
    }
    setCurrentOperator(prev => {
      // Keep operator highlighted but allow new input
      return prev
    })
  }, [display, shouldResetDisplay])

  // Handle decimal point
  const handleDecimal = useCallback(() => {
    setError(null)
    if (shouldResetDisplay) {
      setDisplay("0.")
      setShouldResetDisplay(false)
    } else if (!display.includes(".")) {
      setDisplay(prev => prev + ".")
    }
  }, [display, shouldResetDisplay])

  // Handle operator input
  const handleOperator = useCallback((op: Operation) => {
    setError(null)
    const currentValue = parseDisplay(display)
    
    if (isNaN(currentValue)) {
      setError("Valor inválido")
      return
    }

    // If we have a pending operation, calculate first
    if (previousValue !== null && currentOperator && !shouldResetDisplay) {
      try {
        const result = safeCalculate(previousValue, currentValue, currentOperator)
        const formatted = formatNumber(result)
        setDisplay(formatted)
        setPreviousValue(result)
        setExpression(`${formatted} ${op}`)
      } catch (err) {
        setDisplay("Error")
        setError(err instanceof Error ? err.message : "Error en cálculo")
        setPreviousValue(null)
        setCurrentOperator(null)
        setShouldResetDisplay(true)
        return
      }
    } else {
      setPreviousValue(currentValue)
      setExpression(`${display} ${op}`)
    }

    setCurrentOperator(op)
    setShouldResetDisplay(true)
  }, [display, previousValue, currentOperator, shouldResetDisplay])

  // Handle equals
  const handleEquals = useCallback(() => {
    if (previousValue === null || !currentOperator) return

    const currentValue = parseDisplay(display)
    if (isNaN(currentValue)) {
      setError("Valor inválido")
      return
    }

    try {
      const result = safeCalculate(previousValue, currentValue, currentOperator)
      const formatted = formatNumber(result)
      const fullExpression = `${formatNumber(previousValue)} ${currentOperator} ${display} =`
      
      setExpression(fullExpression)
      setDisplay(formatted)
      addToHistory(fullExpression, formatted)
      
      setPreviousValue(null)
      setCurrentOperator(null)
      setShouldResetDisplay(true)
    } catch (err) {
      setDisplay("Error")
      setError(err instanceof Error ? err.message : "Error en cálculo")
      setPreviousValue(null)
      setCurrentOperator(null)
      setShouldResetDisplay(true)
    }
  }, [display, previousValue, currentOperator, addToHistory])

  // Handle clear
  const handleClear = useCallback(() => {
    if (display !== "0" || previousValue !== null) {
      // Clear current entry only
      setDisplay("0")
    } else {
      // Full clear
      setExpression("")
      setPreviousValue(null)
      setCurrentOperator(null)
    }
    setError(null)
    setShouldResetDisplay(false)
  }, [display, previousValue])

  // Handle all clear
  const handleAllClear = useCallback(() => {
    setDisplay("0")
    setExpression("")
    setPreviousValue(null)
    setCurrentOperator(null)
    setError(null)
    setShouldResetDisplay(false)
  }, [])

  // Handle sign change
  const handleSign = useCallback(() => {
    const currentValue = parseDisplay(display)
    if (isNaN(currentValue)) return
    setDisplay(formatNumber(currentValue * -1))
  }, [display])

  // Handle percent
  const handlePercent = useCallback(() => {
    const currentValue = parseDisplay(display)
    if (isNaN(currentValue)) return
    
    // If there's a pending operation, calculate percent of that value
    if (previousValue !== null) {
      const result = (previousValue * currentValue) / 100
      setDisplay(formatNumber(result))
    } else {
      setDisplay(formatNumber(currentValue / 100))
    }
    setShouldResetDisplay(true)
  }, [display, previousValue])

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (shouldResetDisplay || display === "Error") {
      setDisplay("0")
      setShouldResetDisplay(false)
    } else if (display.length > 1) {
      const newDisplay = display.slice(0, -1)
      setDisplay(newDisplay === "-" ? "0" : newDisplay)
    } else {
      setDisplay("0")
    }
    setError(null)
  }, [display, shouldResetDisplay])

  // Handle scientific functions
  const handleScientific = useCallback((func: ScientificFunction) => {
    const currentValue = parseDisplay(display)
    if (isNaN(currentValue)) {
      setError("Valor inválido")
      return
    }

    try {
      const result = applyScientificFunction(currentValue, func, isRadians)
      const formatted = formatNumber(result)
      const functionExpr = `${func}(${display})`
      
      setExpression(functionExpr)
      setDisplay(formatted)
      addToHistory(`${functionExpr} =`, formatted)
      setShouldResetDisplay(true)
    } catch (err) {
      setDisplay("Error")
      setError(err instanceof Error ? err.message : "Error en función")
      setShouldResetDisplay(true)
    }
  }, [display, isRadians, addToHistory])

  // Handle constants
  const handleConstant = useCallback((constant: keyof typeof CONSTANTS) => {
    const value = CONSTANTS[constant]
    setDisplay(formatNumber(value))
    setShouldResetDisplay(true)
  }, [])

  // Memory functions
  const handleMemoryClear = useCallback(() => setMemory(0), [])
  
  const handleMemoryRecall = useCallback(() => {
    if (memory !== 0) {
      setDisplay(formatNumber(memory))
      setShouldResetDisplay(true)
    }
  }, [memory])

  const handleMemoryAdd = useCallback(() => {
    const currentValue = parseDisplay(display)
    if (!isNaN(currentValue)) {
      setMemory(prev => prev + currentValue)
    }
  }, [display])

  const handleMemorySubtract = useCallback(() => {
    const currentValue = parseDisplay(display)
    if (!isNaN(currentValue)) {
      setMemory(prev => prev - currentValue)
    }
  }, [display])

  // Handle result selection from history
  const handleSelectResult = useCallback((result: string) => {
    setDisplay(result)
    setShouldResetDisplay(true)
  }, [])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for calculator keys
      if ("0123456789.+-*/=%^".includes(e.key) || 
          e.key === "Enter" || e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault()
      }

      if ("0123456789".includes(e.key)) {
        handleNumber(e.key)
      } else if (e.key === ".") {
        handleDecimal()
      } else if (e.key === "+") {
        handleOperator("+")
      } else if (e.key === "-") {
        handleOperator("-")
      } else if (e.key === "*") {
        handleOperator("×")
      } else if (e.key === "/") {
        handleOperator("÷")
      } else if (e.key === "^") {
        handleOperator("^")
      } else if (e.key === "%" ) {
        handlePercent()
      } else if (e.key === "Enter" || e.key === "=") {
        handleEquals()
      } else if (e.key === "Escape") {
        handleAllClear()
      } else if (e.key === "Backspace") {
        handleBackspace()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNumber, handleDecimal, handleOperator, handlePercent, handleEquals, handleAllClear, handleBackspace])

  const clearButtonText = display !== "0" || previousValue !== null ? "C" : "AC"

  return (
    <div 
      ref={calculatorRef}
      className={cn(
        "relative w-full max-w-[360px] mx-auto",
        "transition-all duration-500 ease-out",
        isScientificMode && "max-w-[420px]"
      )}
    >
      {/* Calculator body */}
      <div 
        className={cn(
          "relative glass rounded-[2.5rem] overflow-hidden",
          "shadow-2xl shadow-black/50",
          "transition-all duration-300"
        )}
        style={{
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.05),
            0 25px 50px -12px rgba(0,0,0,0.5),
            0 0 100px rgba(139, 92, 246, 0.1)
          `
        }}
      >
        {/* Top glow effect */}
        <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* History panel */}
        <CalculatorHistory
          history={history}
          onSelectResult={handleSelectResult}
          onClearHistory={() => setHistory([])}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />

        {/* History toggle */}
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className={cn(
            "absolute top-4 left-4 z-40 p-2 rounded-xl",
            "text-muted-foreground/40 hover:text-muted-foreground/70",
            "hover:bg-muted/20 transition-all duration-200",
            isHistoryOpen && "bg-muted/30 text-muted-foreground"
          )}
        >
          <History className="w-4 h-4" />
        </button>

        {/* Display */}
        <CalculatorDisplay
          value={display}
          expression={expression}
          hasMemory={memory !== 0}
          error={error}
          isRadians={isRadians}
        />

        {/* Scientific mode toggle */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setIsScientificMode(!isScientificMode)}
            className={cn(
              "w-full flex items-center justify-center gap-1 py-1.5 rounded-xl",
              "text-xs text-muted-foreground/50 hover:text-muted-foreground/70",
              "hover:bg-muted/20 transition-all duration-200"
            )}
          >
            {isScientificMode ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Modo básico</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Modo científico</span>
              </>
            )}
          </button>
        </div>

        {/* Scientific functions */}
        {isScientificMode && (
          <div className="px-4 pb-3 animate-slide-up">
            <div className="grid grid-cols-5 gap-2 mb-2">
              <CalculatorButton 
                variant="scientific" 
                onClick={() => setIsRadians(!isRadians)}
              >
                {isRadians ? "RAD" : "DEG"}
              </CalculatorButton>
              <CalculatorButton 
                variant="scientific" 
                onClick={() => setIsSecondFunction(!isSecondFunction)}
                isActive={isSecondFunction}
              >
                2nd
              </CalculatorButton>
              <CalculatorButton variant="scientific" onClick={() => handleConstant("PI")}>
                π
              </CalculatorButton>
              <CalculatorButton variant="scientific" onClick={() => handleConstant("E")}>
                e
              </CalculatorButton>
              <CalculatorButton variant="scientific" onClick={() => handleOperator("^")}>
                x^y
              </CalculatorButton>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-2">
              <CalculatorButton 
                variant="scientific" 
                onClick={() => handleScientific(isSecondFunction ? "asin" : "sin")}
              >
                {isSecondFunction ? "sin⁻¹" : "sin"}
              </CalculatorButton>
              <CalculatorButton 
                variant="scientific" 
                onClick={() => handleScientific(isSecondFunction ? "acos" : "cos")}
              >
                {isSecondFunction ? "cos⁻¹" : "cos"}
              </CalculatorButton>
              <CalculatorButton 
                variant="scientific" 
                onClick={() => handleScientific(isSecondFunction ? "atan" : "tan")}
              >
                {isSecondFunction ? "tan⁻¹" : "tan"}
              </CalculatorButton>
              <CalculatorButton 
                variant="scientific" 
                onClick={() => handleScientific(isSecondFunction ? "pow10" : "log")}
              >
                {isSecondFunction ? "10^x" : "log"}
              </CalculatorButton>
              <CalculatorButton 
                variant="scientific" 
                onClick={() => handleScientific(isSecondFunction ? "exp" : "ln")}
              >
                {isSecondFunction ? "e^x" : "ln"}
              </CalculatorButton>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <CalculatorButton variant="scientific" onClick={() => handleScientific("sqrt")}>
                √
              </CalculatorButton>
              <CalculatorButton variant="scientific" onClick={() => handleScientific("cbrt")}>
                ³√
              </CalculatorButton>
              <CalculatorButton variant="scientific" onClick={() => handleScientific("square")}>
                x²
              </CalculatorButton>
              <CalculatorButton variant="scientific" onClick={() => handleScientific("cube")}>
                x³
              </CalculatorButton>
              <CalculatorButton variant="scientific" onClick={() => handleScientific("fact")}>
                x!
              </CalculatorButton>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-3" />
          </div>
        )}

        {/* Memory row */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-5 gap-2">
            <CalculatorButton 
              variant="memory" 
              onClick={handleMemoryClear}
              disabled={memory === 0}
            >
              MC
            </CalculatorButton>
            <CalculatorButton 
              variant="memory" 
              onClick={handleMemoryRecall}
              disabled={memory === 0}
            >
              MR
            </CalculatorButton>
            <CalculatorButton variant="memory" onClick={handleMemoryAdd}>
              M+
            </CalculatorButton>
            <CalculatorButton variant="memory" onClick={handleMemorySubtract}>
              M−
            </CalculatorButton>
            <CalculatorButton variant="function" onClick={handleBackspace}>
              ⌫
            </CalculatorButton>
          </div>
        </div>

        <div className="h-px mx-4 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Main button grid */}
        <div className="p-4 pt-3">
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <CalculatorButton variant="function" onClick={handleClear}>
              {clearButtonText}
            </CalculatorButton>
            <CalculatorButton variant="function" onClick={handleSign}>
              +/−
            </CalculatorButton>
            <CalculatorButton variant="function" onClick={handlePercent}>
              %
            </CalculatorButton>
            <CalculatorButton 
              variant="operator" 
              onClick={() => handleOperator("÷")}
              isActive={currentOperator === "÷"}
            >
              ÷
            </CalculatorButton>

            {/* Row 2 */}
            <CalculatorButton variant="number" onClick={() => handleNumber("7")}>
              7
            </CalculatorButton>
            <CalculatorButton variant="number" onClick={() => handleNumber("8")}>
              8
            </CalculatorButton>
            <CalculatorButton variant="number" onClick={() => handleNumber("9")}>
              9
            </CalculatorButton>
            <CalculatorButton 
              variant="operator" 
              onClick={() => handleOperator("×")}
              isActive={currentOperator === "×"}
            >
              ×
            </CalculatorButton>

            {/* Row 3 */}
            <CalculatorButton variant="number" onClick={() => handleNumber("4")}>
              4
            </CalculatorButton>
            <CalculatorButton variant="number" onClick={() => handleNumber("5")}>
              5
            </CalculatorButton>
            <CalculatorButton variant="number" onClick={() => handleNumber("6")}>
              6
            </CalculatorButton>
            <CalculatorButton 
              variant="operator" 
              onClick={() => handleOperator("-")}
              isActive={currentOperator === "-"}
            >
              −
            </CalculatorButton>

            {/* Row 4 */}
            <CalculatorButton variant="number" onClick={() => handleNumber("1")}>
              1
            </CalculatorButton>
            <CalculatorButton variant="number" onClick={() => handleNumber("2")}>
              2
            </CalculatorButton>
            <CalculatorButton variant="number" onClick={() => handleNumber("3")}>
              3
            </CalculatorButton>
            <CalculatorButton 
              variant="operator" 
              onClick={() => handleOperator("+")}
              isActive={currentOperator === "+"}
            >
              +
            </CalculatorButton>

            {/* Row 5 */}
            <CalculatorButton variant="number" onClick={() => handleNumber("0")} isWide>
              0
            </CalculatorButton>
            <CalculatorButton variant="number" onClick={handleDecimal}>
              .
            </CalculatorButton>
            <CalculatorButton variant="equals" onClick={handleEquals}>
              =
            </CalculatorButton>
          </div>
        </div>

        {/* Bottom glow effect */}
        <div 
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(139, 92, 246, 0.15), transparent 70%)"
          }}
        />
      </div>
    </div>
  )
}
