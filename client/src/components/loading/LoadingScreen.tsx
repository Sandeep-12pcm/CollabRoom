"use client"

import { useEffect, useState } from "react"
// import "./style.css"
export default function LoadingScreen() {
  const [displayText, setDisplayText] = useState("")
  const fullText = "> Initializing development environment..."

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(96, 165, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float" />
      <div
        className="absolute bottom-20 right-20 w-72 h-72 bg-secondary rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-3xl opacity-15 animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center gap-12 px-4">
        <div className="flex items-center justify-center gap-8">
          <div className="text-4xl font-mono text-primary animate-pulse-glow">&lt;</div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-lg border-2 border-transparent border-t-primary border-r-accent border-b-secondary animate-spin" />
              <div className="absolute inset-2 rounded-lg border border-primary/30 flex items-center justify-center">
                <span className="text-2xl font-mono font-bold text-primary">&lt;/&gt;</span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2 font-sans">Building</h1>
              <p className="font-mono text-sm text-muted-foreground h-6">
                {displayText}
                <span className="animate-code-blink">_</span>
              </p>
            </div>
          </div>

          <div className="text-4xl font-mono text-accent animate-pulse-glow">&gt;</div>
        </div>

        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        <div className="mt-8 p-6 bg-card border border-border rounded-lg backdrop-blur-sm max-w-md">
          <div className="font-mono text-xs text-muted-foreground space-y-2">
            <div className="text-primary">
              {"const"} <span className="text-accent">app</span> = <span className="text-secondary">await</span>{" "}
              <span className="text-primary">initialize</span>()
            </div>
            <div className="text-primary">
              {"const"} <span className="text-accent">modules</span> = <span className="text-secondary">await</span>{" "}
              <span className="text-primary">load</span>()
            </div>
            <div className="text-primary">
              {"return"} <span className="text-accent">app</span>.<span className="text-secondary">start</span>()
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">Compiling your awesome project...</p>
      </div>
    </div>
  )
}
