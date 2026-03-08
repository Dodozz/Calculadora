"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Copy, Check, History, Trash2, X, ChevronDown, ChevronUp } from "lucide-react"

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type Op = "+" | "-" | "x" | "/" | "^" | null
type SciFunc =
  | "sin" | "cos" | "tan"
  | "asin" | "acos" | "atan"
  | "log" | "ln" | "sqrt" | "cbrt"
  | "exp" | "abs" | "fact" | "inv"
  | "sq" | "cu" | "p10"

interface HistEntry { id: string; expr: string; result: string }

// ─── MATH UTILS (precision-safe) ──────────────────────────────────────────────
function safeCalc(a: number, b: number, op: Op): number {
  if (op === null) return b
  // Use string-based precision for add/sub to avoid IEEE float errors
  const fix = (n: number) => parseFloat(n.toPrecision(12))
  switch (op) {
    case "+": return fix(a + b)
    case "-": return fix(a - b)
    case "x": return fix(a * b)
    case "/":
      if (b === 0) throw new Error("Division por cero")
      return fix(a / b)
    case "^": return fix(Math.pow(a, b))
    default: return b
  }
}

function applySci(v: number, fn: SciFunc, rad: boolean): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  switch (fn) {
    case "sin": return rad ? Math.sin(v) : Math.sin(toRad(v))
    case "cos": return rad ? Math.cos(v) : Math.cos(toRad(v))
    case "tan": {
      const r = Math.tan(rad ? v : toRad(v))
      if (!isFinite(r)) throw new Error("Tangente indefinida")
      return r
    }
    case "asin":
      if (v < -1 || v > 1) throw new Error("Fuera de rango [-1,1]")
      return rad ? Math.asin(v) : toDeg(Math.asin(v))
    case "acos":
      if (v < -1 || v > 1) throw new Error("Fuera de rango [-1,1]")
      return rad ? Math.acos(v) : toDeg(Math.acos(v))
    case "atan": return rad ? Math.atan(v) : toDeg(Math.atan(v))
    case "log":
      if (v <= 0) throw new Error("Log de no-positivo")
      return Math.log10(v)
    case "ln":
      if (v <= 0) throw new Error("Ln de no-positivo")
      return Math.log(v)
    case "sqrt":
      if (v < 0) throw new Error("Raiz de negativo")
      return Math.sqrt(v)
    case "cbrt": return Math.cbrt(v)
    case "exp": return Math.exp(v)
    case "abs": return Math.abs(v)
    case "inv":
      if (v === 0) throw new Error("No se puede invertir cero")
      return 1 / v
    case "sq": return v * v
    case "cu": return v * v * v
    case "p10": return Math.pow(10, v)
    case "fact": {
      if (v < 0) throw new Error("Factorial de negativo")
      if (!Number.isInteger(v)) throw new Error("Factorial requiere entero")
      if (v > 170) throw new Error("Numero muy grande")
      let r = 1; for (let i = 2; i <= v; i++) r *= i; return r
    }
    default: return v
  }
}

function fmt(n: number): string {
  if (isNaN(n)) return "Error"
  if (!isFinite(n)) return n > 0 ? "Infinity" : "-Infinity"
  // Fix JS float artifacts like 0.1+0.2
  const s = parseFloat(n.toPrecision(12)).toString()
  if (s.length > 14 || Math.abs(n) >= 1e12 || (Math.abs(n) < 0.0001 && n !== 0)) {
    return n.toExponential(6)
  }
  return s
}

function parseDsp(v: string): number {
  if (v === "Error" || v === "Infinity" || v === "-Infinity") return NaN
  return parseFloat(v)
}

// ─── ANIMATED BACKGROUND (Canvas) ─────────────────────────────────────────────
function AuroraBg() {
  const ref = useRef<HTMLCanvasElement>(null)
  const blobCfg = useMemo(() => [
    { x: 0.2, y: 0.3, r: 0.38, sx: 0.14, sy: 0.11, c: [130, 80, 230] },
    { x: 0.8, y: 0.7, r: 0.42, sx: 0.09, sy: 0.16, c: [50, 120, 240] },
    { x: 0.5, y: 0.9, r: 0.3, sx: 0.18, sy: 0.07, c: [20, 160, 220] },
    { x: 0.9, y: 0.15, r: 0.28, sx: 0.11, sy: 0.2, c: [160, 70, 240] },
  ], [])
  const dots = useMemo(() =>
    Array.from({ length: 40 }, () => ({
      x: Math.random(), y: Math.random(),
      sz: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      op: Math.random() * 0.4 + 0.15,
      hue: Math.random() * 50 + 245,
    })), [])

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext("2d"); if (!ctx) return
    let id = 0, t = 0
    const resize = () => {
      const d = window.devicePixelRatio || 1
      c.width = innerWidth * d; c.height = innerHeight * d
      ctx.scale(d, d); c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px"
    }
    resize(); addEventListener("resize", resize)
    const loop = () => {
      const w = innerWidth, h = innerHeight; t += 0.004
      ctx.fillStyle = "#08080f"; ctx.fillRect(0, 0, w, h)
      blobCfg.forEach((b, i) => {
        const ox = Math.sin(t * b.sx + i) * 0.15
        const oy = Math.cos(t * b.sy + i * 0.5) * 0.15
        const bx = (b.x + ox) * w, by = (b.y + oy) * h, br = b.r * Math.min(w, h)
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br)
        g.addColorStop(0, `rgba(${b.c.join(",")},0.13)`)
        g.addColorStop(0.6, `rgba(${b.c.join(",")},0.04)`)
        g.addColorStop(1, `rgba(${b.c.join(",")},0)`)
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill()
      })
      dots.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0
        const fo = p.op * (0.6 + Math.sin(t * 3 + p.x * 10) * 0.4)
        ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.sz, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},70%,70%,${fo})`; ctx.fill()
      })
      id = requestAnimationFrame(loop)
    }
    loop()
    return () => { removeEventListener("resize", resize); cancelAnimationFrame(id) }
  }, [blobCfg, dots])

  return <canvas ref={ref} className="fixed inset-0 -z-10" style={{ background: "#08080f" }} />
}

// ─── FLOATING PARTICLES (CSS) ─────────────────────────────────────────────────
function Particles() {
  const items = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      key: i,
      left: Math.random() * 100,
      w: Math.random() * 3 + 1.5,
      hue: 250 + Math.random() * 40,
      op: Math.random() * 0.35 + 0.15,
      dur: Math.random() * 14 + 10,
      del: Math.random() * 14,
      drift: (Math.random() - 0.5) * 180,
    })), [])
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
      {items.map(p => (
        <div
          key={p.key}
          className="absolute rounded-full animate-float-particle"
          style={{
            left: `${p.left}%`,
            width: p.w, height: p.w,
            background: `radial-gradient(circle, hsla(${p.hue},75%,65%,${p.op}), transparent)`,
            boxShadow: `0 0 ${p.w * 3}px hsla(${p.hue},75%,65%,0.25)`,
            ["--dur" as string]: `${p.dur}s`,
            ["--del" as string]: `-${p.del}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

// ─── CALCULATOR BUTTON ────────────────────────────────────────────────────────
type BtnVariant = "num" | "op" | "fn" | "eq" | "mem" | "sci"

function CalcBtn({
  children, onClick, variant = "num", active = false, wide = false, disabled = false,
}: {
  children: React.ReactNode; onClick: () => void;
  variant?: BtnVariant; active?: boolean; wide?: boolean; disabled?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    // Ripple
    const btn = ref.current; if (!btn) return
    const rp = document.createElement("span")
    const rect = btn.getBoundingClientRect()
    const sz = Math.max(rect.width, rect.height)
    rp.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;left:${e.clientX - rect.left - sz / 2}px;top:${e.clientY - rect.top - sz / 2}px;background:radial-gradient(circle,rgba(255,255,255,0.35),transparent 60%);border-radius:50%;transform:scale(0);animation:ripple-effect .5s ease-out forwards;pointer-events:none;`
    btn.appendChild(rp); setTimeout(() => rp.remove(), 500)
    onClick()
  }, [onClick, disabled])

  const base = "relative overflow-hidden rounded-2xl flex items-center justify-center font-medium calc-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
  const size = wide ? "col-span-2 h-[3.6rem]" : "h-[3.6rem]"

  const styles: Record<BtnVariant, string> = {
    num: "bg-secondary/40 text-foreground hover:bg-secondary/60 border border-secondary/30 shadow-lg shadow-black/20 text-lg",
    op: `border text-lg ${active
      ? "bg-primary/50 border-primary/60 text-primary-foreground animate-pulse-glow shadow-xl shadow-primary/20"
      : "bg-primary/15 border-primary/25 text-primary-foreground hover:bg-primary/25 shadow-lg shadow-primary/10"}`,
    fn: "bg-muted/40 border border-muted/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground shadow-lg shadow-black/20 text-base",
    eq: "bg-gradient-to-br from-primary to-blue-600 border border-primary/40 text-primary-foreground font-semibold hover:brightness-110 shadow-xl shadow-primary/25 animate-gradient-flow text-xl",
    mem: "bg-accent/8 border border-accent/15 text-accent hover:bg-accent/15 text-xs font-semibold tracking-wide",
    sci: "bg-orange-500/8 border border-orange-500/15 text-orange-400 hover:bg-orange-500/15 text-xs font-semibold",
  }

  return (
    <button
      ref={ref} onClick={handleClick} disabled={disabled}
      className={`${base} ${size} ${styles[variant]} ${disabled ? "opacity-35 cursor-not-allowed" : ""}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </button>
  )
}

// ─── DISPLAY ──────────────────────────────────────────────────────────────────
function Display({
  value, expression, hasMem, error, isRad,
}: {
  value: string; expression: string; hasMem: boolean; error: string | null; isRad: boolean
}) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { /* noop */ }
  }, [value])

  const sz = value.length > 12 ? "text-2xl" : value.length > 8 ? "text-4xl" : "text-5xl"
  const isErr = !!error || value === "Error"

  return (
    <div className="relative px-5 pt-5 pb-7">
      {/* Status bar */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/40 uppercase">Calc Pro</span>
        {hasMem && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-semibold text-accent/60">M</span>
          </span>
        )}
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isRad ? "bg-primary/15 text-primary/70" : "bg-muted/60 text-muted-foreground/50"}`}>
          {isRad ? "RAD" : "DEG"}
        </span>
        {/* Copy button */}
        <button onClick={handleCopy}
          className="ml-auto p-1.5 rounded-lg text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/20 transition-all"
          aria-label="Copiar resultado"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expression */}
      <div className="mt-5 min-h-[1.25rem] text-right">
        <span className="text-sm text-muted-foreground/45 font-light tracking-wide">{expression}</span>
      </div>

      {/* Main number */}
      <div className="mt-1 text-right">
        <span
          className={`display-mono font-light tracking-tight transition-all duration-200 animate-digit-enter ${sz} ${isErr ? "text-destructive animate-shake" : "text-foreground"}`}
          style={{ textShadow: isErr ? "0 0 25px hsla(0,84%,60%,0.35)" : "0 0 35px hsla(263,70%,55%,0.2)" }}
        >
          {value}
        </span>
      </div>

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-1.5 right-5 animate-slide-up">
          <span className="text-xs text-destructive/60">{error}</span>
        </div>
      )}

      {/* Bottom line */}
      <div className="absolute bottom-0 inset-x-5">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
      </div>
    </div>
  )
}

// ─── HISTORY PANEL ────────────────────────────────────────────────────────────
function HistoryPanel({
  history, onSelect, onClear, isOpen, onClose,
}: {
  history: HistEntry[]; onSelect: (r: string) => void; onClear: () => void; isOpen: boolean; onClose: () => void
}) {
  if (!isOpen) return null
  return (
    <div className="absolute inset-0 z-50 animate-slide-up">
      <div className="absolute inset-0 glass rounded-[2.5rem] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <History className="w-4 h-4" /> Historial
          </span>
          <span className="flex items-center gap-1">
            {history.length > 0 && (
              <button onClick={onClear} className="p-2 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label="Borrar historial">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-colors" aria-label="Cerrar historial">
              <X className="w-4 h-4" />
            </button>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/35">
              <History className="w-10 h-10 mb-3 opacity-25" />
              <p className="text-sm">Sin historial</p>
              <p className="text-xs mt-1">Tus calculos apareceran aqui</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {history.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { onSelect(e.result); onClose() }}
                  className="w-full p-3 rounded-xl text-right hover:bg-muted/25 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <div className="text-xs text-muted-foreground/40 mb-0.5 group-hover:text-muted-foreground/60 transition-colors">{e.expr}</div>
                  <div className="display-mono text-lg text-foreground group-hover:text-primary transition-colors">{e.result}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN CALCULATOR ──────────────────────────────────────────────────────────
export default function HomePage() {
  const [dsp, setDsp] = useState("0")
  const [expr, setExpr] = useState("")
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<Op>(null)
  const [reset, setReset] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [mem, setMem] = useState(0)
  const [hist, setHist] = useState<HistEntry[]>([])
  const [histOpen, setHistOpen] = useState(false)
  const [sci, setSci] = useState(false)
  const [rad, setRad] = useState(false)
  const [sec, setSec] = useState(false)

  // Clear error after delay
  useEffect(() => {
    if (err) { const t = setTimeout(() => setErr(null), 3000); return () => clearTimeout(t) }
  }, [err])

  const addHist = useCallback((ex: string, res: string) => {
    setHist(p => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, expr: ex, result: res }, ...p.slice(0, 49)])
  }, [])

  const numClick = useCallback((n: string) => {
    setErr(null)
    if (reset) { setDsp(n); setReset(false) }
    else if (dsp === "0" && n !== ".") setDsp(n)
    else if (dsp.length < 15) setDsp(p => p + n)
  }, [dsp, reset])

  const decClick = useCallback(() => {
    setErr(null)
    if (reset) { setDsp("0."); setReset(false) }
    else if (!dsp.includes(".")) setDsp(p => p + ".")
  }, [dsp, reset])

  const opClick = useCallback((newOp: Op) => {
    setErr(null)
    const cv = parseDsp(dsp)
    if (isNaN(cv)) { setErr("Valor invalido"); return }
    if (prev !== null && op && !reset) {
      try {
        const r = safeCalc(prev, cv, op)
        const f = fmt(r)
        setDsp(f); setPrev(r); setExpr(`${f} ${newOp}`)
      } catch (e: unknown) {
        setDsp("Error"); setErr(e instanceof Error ? e.message : "Error"); setPrev(null); setOp(null); setReset(true); return
      }
    } else {
      setPrev(cv); setExpr(`${dsp} ${newOp}`)
    }
    setOp(newOp); setReset(true)
  }, [dsp, prev, op, reset])

  const eqClick = useCallback(() => {
    if (prev === null || !op) return
    const cv = parseDsp(dsp)
    if (isNaN(cv)) { setErr("Valor invalido"); return }
    try {
      const r = safeCalc(prev, cv, op)
      const f = fmt(r)
      const fullExpr = `${fmt(prev)} ${op} ${dsp} =`
      setExpr(fullExpr); setDsp(f); addHist(fullExpr, f)
      setPrev(null); setOp(null); setReset(true)
    } catch (e: unknown) {
      setDsp("Error"); setErr(e instanceof Error ? e.message : "Error"); setPrev(null); setOp(null); setReset(true)
    }
  }, [dsp, prev, op, addHist])

  const clearClick = useCallback(() => {
    if (dsp !== "0" || prev !== null) { setDsp("0") }
    else { setExpr(""); setPrev(null); setOp(null) }
    setErr(null); setReset(false)
  }, [dsp, prev])

  const allClear = useCallback(() => {
    setDsp("0"); setExpr(""); setPrev(null); setOp(null); setErr(null); setReset(false)
  }, [])

  const signClick = useCallback(() => {
    const v = parseDsp(dsp); if (isNaN(v)) return
    setDsp(fmt(v * -1))
  }, [dsp])

  const pctClick = useCallback(() => {
    const v = parseDsp(dsp); if (isNaN(v)) return
    if (prev !== null) setDsp(fmt((prev * v) / 100))
    else setDsp(fmt(v / 100))
    setReset(true)
  }, [dsp, prev])

  const bksp = useCallback(() => {
    if (reset || dsp === "Error") { setDsp("0"); setReset(false) }
    else if (dsp.length > 1) { const nd = dsp.slice(0, -1); setDsp(nd === "-" ? "0" : nd) }
    else setDsp("0")
    setErr(null)
  }, [dsp, reset])

  const sciClick = useCallback((fn: SciFunc) => {
    const v = parseDsp(dsp); if (isNaN(v)) { setErr("Valor invalido"); return }
    try {
      const r = applySci(v, fn, rad)
      const f = fmt(r)
      const ex = `${fn}(${dsp})`
      setExpr(ex); setDsp(f); addHist(`${ex} =`, f); setReset(true)
    } catch (e: unknown) {
      setDsp("Error"); setErr(e instanceof Error ? e.message : "Error"); setReset(true)
    }
  }, [dsp, rad, addHist])

  const constClick = useCallback((c: "pi" | "e") => {
    setDsp(fmt(c === "pi" ? Math.PI : Math.E)); setReset(true)
  }, [])

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ("0123456789.+-*/=%^".includes(e.key) || ["Enter", "Escape", "Backspace"].includes(e.key)) e.preventDefault()
      if ("0123456789".includes(e.key)) numClick(e.key)
      else if (e.key === ".") decClick()
      else if (e.key === "+") opClick("+")
      else if (e.key === "-") opClick("-")
      else if (e.key === "*") opClick("x")
      else if (e.key === "/") opClick("/")
      else if (e.key === "^") opClick("^")
      else if (e.key === "%") pctClick()
      else if (e.key === "Enter" || e.key === "=") eqClick()
      else if (e.key === "Escape") allClear()
      else if (e.key === "Backspace") bksp()
    }
    addEventListener("keydown", handler)
    return () => removeEventListener("keydown", handler)
  }, [numClick, decClick, opClick, pctClick, eqClick, allClear, bksp])

  const clearTxt = dsp !== "0" || prev !== null ? "C" : "AC"

  return (
    <main className="min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <AuroraBg />
      <Particles />

      {/* 3D tilt wrapper */}
      <div className="relative z-10" style={{ perspective: "1000px" }}>
        <div
          className="transition-transform duration-100 ease-out"
          onMouseMove={e => {
            const r = e.currentTarget.getBoundingClientRect()
            const rx = (e.clientY - r.top - r.height / 2) / r.height
            const ry = -(e.clientX - r.left - r.width / 2) / r.width
            e.currentTarget.style.transform = `rotateX(${rx * 8}deg) rotateY(${ry * 8}deg)`
          }}
          onMouseLeave={e => { e.currentTarget.style.transform = "rotateX(0) rotateY(0)" }}
        >
          {/* Calculator shell */}
          <div
            className={`relative w-[22rem] mx-auto glass rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 transition-all duration-500 ${sci ? "w-[25rem]" : ""}`}
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 30px 60px -15px rgba(0,0,0,0.55), 0 0 80px rgba(130,80,230,0.08)" }}
          >
            {/* Top glow */}
            <div className="absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {/* History overlay */}
            <HistoryPanel history={hist} onSelect={r => { setDsp(r); setReset(true) }} onClear={() => setHist([])} isOpen={histOpen} onClose={() => setHistOpen(false)} />

            {/* History toggle */}
            <button
              onClick={() => setHistOpen(!histOpen)}
              className={`absolute top-4 left-5 z-40 p-2 rounded-xl text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/15 transition-all ${histOpen ? "bg-muted/25 text-muted-foreground/70" : ""}`}
              aria-label="Historial"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Display */}
            <Display value={dsp} expression={expr} hasMem={mem !== 0} error={err} isRad={rad} />

            {/* Scientific toggle */}
            <div className="px-5 pb-2">
              <button
                onClick={() => setSci(!sci)}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs text-muted-foreground/35 hover:text-muted-foreground/55 hover:bg-muted/15 transition-all"
              >
                {sci ? <><ChevronUp className="w-3 h-3" /><span>Modo basico</span></> : <><ChevronDown className="w-3 h-3" /><span>Modo cientifico</span></>}
              </button>
            </div>

            {/* Scientific buttons */}
            {sci && (
              <div className="px-5 pb-3 animate-slide-up">
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <CalcBtn variant="sci" onClick={() => setRad(!rad)}>{rad ? "RAD" : "DEG"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => setSec(!sec)} active={sec}>2nd</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => constClick("pi")}>{"π"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => constClick("e")}>e</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => opClick("^")}>{"x^y"}</CalcBtn>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <CalcBtn variant="sci" onClick={() => sciClick(sec ? "asin" : "sin")}>{sec ? "sin⁻¹" : "sin"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick(sec ? "acos" : "cos")}>{sec ? "cos⁻¹" : "cos"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick(sec ? "atan" : "tan")}>{sec ? "tan⁻¹" : "tan"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick(sec ? "p10" : "log")}>{sec ? "10^x" : "log"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick(sec ? "exp" : "ln")}>{sec ? "e^x" : "ln"}</CalcBtn>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <CalcBtn variant="sci" onClick={() => sciClick("sqrt")}>{"√"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick("cbrt")}>{"³√"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick("sq")}>{"x²"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick("cu")}>{"x³"}</CalcBtn>
                  <CalcBtn variant="sci" onClick={() => sciClick("fact")}>{"x!"}</CalcBtn>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-3" />
              </div>
            )}

            {/* Memory row */}
            <div className="px-5 pb-3">
              <div className="grid grid-cols-5 gap-2">
                <CalcBtn variant="mem" onClick={() => setMem(0)} disabled={mem === 0}>MC</CalcBtn>
                <CalcBtn variant="mem" onClick={() => { if (mem !== 0) { setDsp(fmt(mem)); setReset(true) } }} disabled={mem === 0}>MR</CalcBtn>
                <CalcBtn variant="mem" onClick={() => { const v = parseDsp(dsp); if (!isNaN(v)) setMem(p => p + v) }}>{"M+"}</CalcBtn>
                <CalcBtn variant="mem" onClick={() => { const v = parseDsp(dsp); if (!isNaN(v)) setMem(p => p - v) }}>{"M-"}</CalcBtn>
                <CalcBtn variant="fn" onClick={bksp}>{"⌫"}</CalcBtn>
              </div>
            </div>

            <div className="h-px mx-5 bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Main keypad */}
            <div className="p-5 pt-3">
              <div className="grid grid-cols-4 gap-3">
                <CalcBtn variant="fn" onClick={clearClick}>{clearTxt}</CalcBtn>
                <CalcBtn variant="fn" onClick={signClick}>{"+/-"}</CalcBtn>
                <CalcBtn variant="fn" onClick={pctClick}>%</CalcBtn>
                <CalcBtn variant="op" onClick={() => opClick("/")} active={op === "/"}>{"÷"}</CalcBtn>

                <CalcBtn onClick={() => numClick("7")}>7</CalcBtn>
                <CalcBtn onClick={() => numClick("8")}>8</CalcBtn>
                <CalcBtn onClick={() => numClick("9")}>9</CalcBtn>
                <CalcBtn variant="op" onClick={() => opClick("x")} active={op === "x"}>{"×"}</CalcBtn>

                <CalcBtn onClick={() => numClick("4")}>4</CalcBtn>
                <CalcBtn onClick={() => numClick("5")}>5</CalcBtn>
                <CalcBtn onClick={() => numClick("6")}>6</CalcBtn>
                <CalcBtn variant="op" onClick={() => opClick("-")} active={op === "-"}>{"−"}</CalcBtn>

                <CalcBtn onClick={() => numClick("1")}>1</CalcBtn>
                <CalcBtn onClick={() => numClick("2")}>2</CalcBtn>
                <CalcBtn onClick={() => numClick("3")}>3</CalcBtn>
                <CalcBtn variant="op" onClick={() => opClick("+")} active={op === "+"}>+</CalcBtn>

                <CalcBtn onClick={() => numClick("0")} wide>0</CalcBtn>
                <CalcBtn onClick={decClick}>.</CalcBtn>
                <CalcBtn variant="eq" onClick={eqClick}>=</CalcBtn>
              </div>
            </div>

            {/* Bottom glow */}
            <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none opacity-25"
              style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(130,80,230,0.25), transparent 70%)" }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="fixed bottom-4 inset-x-0 text-center text-xs text-muted-foreground/20">Calc Pro</p>
    </main>
  )
}
