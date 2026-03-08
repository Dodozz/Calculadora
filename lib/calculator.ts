// Calculator logic with all bug fixes and scientific functions
import Decimal from 'decimal.js'

// Configure Decimal.js for high precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export type Operation = '+' | '-' | '×' | '÷' | '^' | 'mod' | null
export type ScientificFunction = 
  | 'sin' | 'cos' | 'tan' 
  | 'asin' | 'acos' | 'atan'
  | 'log' | 'ln' | 'sqrt' | 'cbrt'
  | 'exp' | 'abs' | 'fact' | 'inv'
  | 'square' | 'cube' | 'pow10'

export interface CalculatorState {
  display: string
  expression: string
  memory: number
  history: HistoryEntry[]
  isRadians: boolean
  isScientificMode: boolean
  error: string | null
}

export interface HistoryEntry {
  id: string
  expression: string
  result: string
  timestamp: Date
}

// Safe arithmetic using Decimal.js to avoid floating point errors
export function safeCalculate(a: number, b: number, op: Operation): number {
  if (op === null) return b
  
  const decA = new Decimal(a)
  const decB = new Decimal(b)
  
  switch (op) {
    case '+':
      return decA.plus(decB).toNumber()
    case '-':
      return decA.minus(decB).toNumber()
    case '×':
      return decA.times(decB).toNumber()
    case '÷':
      if (b === 0) {
        throw new Error('No se puede dividir por cero')
      }
      return decA.dividedBy(decB).toNumber()
    case '^':
      return decA.pow(decB).toNumber()
    case 'mod':
      if (b === 0) {
        throw new Error('No se puede hacer módulo por cero')
      }
      return decA.mod(decB).toNumber()
    default:
      return b
  }
}

// Scientific functions
export function applyScientificFunction(value: number, func: ScientificFunction, isRadians: boolean): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180
  const toDegrees = (rad: number) => (rad * 180) / Math.PI
  
  switch (func) {
    case 'sin':
      return isRadians ? Math.sin(value) : Math.sin(toRadians(value))
    case 'cos':
      return isRadians ? Math.cos(value) : Math.cos(toRadians(value))
    case 'tan':
      const tanInput = isRadians ? value : toRadians(value)
      const tanResult = Math.tan(tanInput)
      if (!isFinite(tanResult)) throw new Error('Tangente indefinida')
      return tanResult
    case 'asin':
      if (value < -1 || value > 1) throw new Error('Valor fuera de rango [-1, 1]')
      return isRadians ? Math.asin(value) : toDegrees(Math.asin(value))
    case 'acos':
      if (value < -1 || value > 1) throw new Error('Valor fuera de rango [-1, 1]')
      return isRadians ? Math.acos(value) : toDegrees(Math.acos(value))
    case 'atan':
      return isRadians ? Math.atan(value) : toDegrees(Math.atan(value))
    case 'log':
      if (value <= 0) throw new Error('Logaritmo de número no positivo')
      return Math.log10(value)
    case 'ln':
      if (value <= 0) throw new Error('Logaritmo de número no positivo')
      return Math.log(value)
    case 'sqrt':
      if (value < 0) throw new Error('Raíz de número negativo')
      return Math.sqrt(value)
    case 'cbrt':
      return Math.cbrt(value)
    case 'exp':
      return Math.exp(value)
    case 'abs':
      return Math.abs(value)
    case 'fact':
      return factorial(value)
    case 'inv':
      if (value === 0) throw new Error('No se puede invertir cero')
      return 1 / value
    case 'square':
      return value * value
    case 'cube':
      return value * value * value
    case 'pow10':
      return Math.pow(10, value)
    default:
      return value
  }
}

function factorial(n: number): number {
  if (n < 0) throw new Error('Factorial de número negativo')
  if (!Number.isInteger(n)) throw new Error('Factorial requiere entero')
  if (n > 170) throw new Error('Número muy grande para factorial')
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

// Format number for display
export function formatNumber(n: number): string {
  if (isNaN(n)) return 'Error'
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞'
  
  // Use Decimal.js for precise formatting
  const dec = new Decimal(n)
  
  // Handle very small numbers that are essentially zero
  if (dec.abs().lessThan(1e-15) && dec.abs().greaterThan(0)) {
    return dec.toExponential(6)
  }
  
  // For numbers that would be too long, use exponential notation
  const str = dec.toSignificantDigits(12).toString()
  
  if (str.length > 14 || Math.abs(n) >= 1e12 || (Math.abs(n) < 0.0001 && n !== 0)) {
    return dec.toExponential(6)
  }
  
  // Clean up trailing zeros after decimal
  if (str.includes('.')) {
    return str.replace(/\.?0+$/, '')
  }
  
  return str
}

// Parse display value safely
export function parseDisplay(value: string): number {
  if (value === 'Error' || value === '∞' || value === '-∞') {
    return NaN
  }
  return parseFloat(value)
}

// Generate unique ID for history entries
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Constants
export const CONSTANTS = {
  PI: Math.PI,
  E: Math.E,
  PHI: (1 + Math.sqrt(5)) / 2, // Golden ratio
} as const
