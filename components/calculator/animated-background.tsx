"use client"

import { useEffect, useRef, useMemo } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate particles with memoization
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.0003,
      speedY: (Math.random() - 0.5) * 0.0003,
      opacity: Math.random() * 0.5 + 0.2,
      hue: Math.random() * 60 + 240, // Purple to blue range
    }))
  }, [])

  // Aurora blobs configuration
  const blobs = useMemo(() => [
    { x: 0.2, y: 0.2, r: 0.35, speedX: 0.15, speedY: 0.12, color: [139, 92, 246] },  // Primary purple
    { x: 0.8, y: 0.7, r: 0.4, speedX: 0.1, speedY: 0.18, color: [59, 130, 246] },   // Blue
    { x: 0.5, y: 0.9, r: 0.3, speedX: 0.2, speedY: 0.08, color: [14, 165, 233] },   // Sky blue
    { x: 0.9, y: 0.1, r: 0.25, speedX: 0.12, speedY: 0.22, color: [168, 85, 247] }, // Purple
  ], [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }

    resize()
    window.addEventListener("resize", resize)

    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      time += 0.005

      // Clear with dark background
      ctx.fillStyle = "#0a0a0f"
      ctx.fillRect(0, 0, w, h)

      // Draw aurora blobs
      blobs.forEach((blob, i) => {
        const offsetX = Math.sin(time * blob.speedX + i) * 0.15
        const offsetY = Math.cos(time * blob.speedY + i * 0.5) * 0.15
        const x = (blob.x + offsetX) * w
        const y = (blob.y + offsetY) * h
        const r = blob.r * Math.min(w, h)

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(0, `rgba(${blob.color.join(",")}, 0.15)`)
        gradient.addColorStop(0.5, `rgba(${blob.color.join(",")}, 0.05)`)
        gradient.addColorStop(1, `rgba(${blob.color.join(",")}, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw particles
      particles.forEach((p) => {
        // Update position
        p.x += p.speedX
        p.y += p.speedY

        // Wrap around edges
        if (p.x < 0) p.x = 1
        if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1
        if (p.y > 1) p.y = 0

        // Draw particle
        const px = p.x * w
        const py = p.y * h
        const flickerOpacity = p.opacity * (0.7 + Math.sin(time * 3 + p.x * 10) * 0.3)

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${flickerOpacity})`
        ctx.fill()
      })

      // Add subtle noise overlay effect via gradient
      const noiseGradient = ctx.createLinearGradient(0, 0, w, h)
      noiseGradient.addColorStop(0, `rgba(139, 92, 246, ${0.02 + Math.sin(time) * 0.01})`)
      noiseGradient.addColorStop(1, `rgba(59, 130, 246, ${0.02 + Math.cos(time) * 0.01})`)
      ctx.fillStyle = noiseGradient
      ctx.fillRect(0, 0, w, h)

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [blobs, particles])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10"
        style={{ background: "#0a0a0f" }}
      />
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  )
}
