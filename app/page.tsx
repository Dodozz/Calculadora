"use client"

import { Calculator } from "@/components/calculator/calculator"
import { AnimatedBackground } from "@/components/calculator/animated-background"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <AnimatedBackground />
      
      {/* Floating particles layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: `radial-gradient(circle, hsla(${260 + Math.random() * 40}, 80%, 70%, ${Math.random() * 0.4 + 0.2}), transparent)`,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px hsla(${260 + Math.random() * 40}, 80%, 70%, 0.3)`,
              // @ts-expect-error CSS custom properties
              "--duration": `${Math.random() * 15 + 10}s`,
              "--delay": `-${Math.random() * 15}s`,
              "--drift": `${(Math.random() - 0.5) * 200}px`,
            }}
          />
        ))}
      </div>
      
      {/* Calculator wrapper with 3D tilt effect */}
      <div 
        className="relative z-10 perspective-wrapper"
        style={{
          perspective: "1000px",
        }}
      >
        <div 
          className="calc-tilt transition-transform duration-100 ease-out"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = (e.clientY - rect.top - rect.height / 2) / rect.height
            const y = -(e.clientX - rect.left - rect.width / 2) / rect.width
            e.currentTarget.style.transform = `rotateX(${x * 10}deg) rotateY(${y * 10}deg)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)"
          }}
        >
          <Calculator />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground/30">
          Calc Pro - Scientific Calculator
        </p>
      </div>
    </main>
  )
}
