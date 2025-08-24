import { useEffect, useRef } from 'react'

interface MatrixRainProps {
  className?: string
  intensity?: 'low' | 'medium' | 'high'
  color?: 'orange' | 'green' | 'mixed'
}

export function MatrixRain({ className = '', intensity = 'low', color = 'orange' }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Matrix characters (mix of letters, numbers, and symbols)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`'
    const charArray = chars.split('')

    // Column configuration based on intensity
    const intensityConfig = {
      low: { columns: Math.floor(canvas.width / 40), speed: 50 },
      medium: { columns: Math.floor(canvas.width / 25), speed: 30 },
      high: { columns: Math.floor(canvas.width / 15), speed: 20 }
    }

    const config = intensityConfig[intensity]
    const fontSize = 14
    const columns = config.columns
    const drops: number[] = new Array(columns).fill(1)

    // Color configuration
    const colors = {
      orange: ['#f97316', '#ea580c', '#c2410c', '#9a3412'],
      green: ['#39ff14', '#00ff41', '#00ff00', '#00cc00'],
      mixed: ['#f97316', '#39ff14', '#ea580c', '#00ff41']
    }

    const colorPalette = colors[color]

    const draw = () => {
      // Create trailing effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set font
      ctx.font = `${fontSize}px 'Courier New', monospace`

      for (let i = 0; i < drops.length; i++) {
        // Pick random character
        const char = charArray[Math.floor(Math.random() * charArray.length)]
        
        // Pick random color from palette
        const colorIndex = Math.floor(Math.random() * colorPalette.length)
        ctx.fillStyle = colorPalette[colorIndex]

        // Add glow effect for leading characters
        if (Math.random() > 0.8) {
          ctx.shadowColor = colorPalette[0]
          ctx.shadowBlur = 10
        } else {
          ctx.shadowBlur = 0
        }

        // Draw character
        const x = i * (canvas.width / columns)
        const y = drops[i] * fontSize
        ctx.fillText(char, x, y)

        // Reset drop to top randomly or when it reaches bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        // Move drop down
        drops[i]++
      }
    }

    const interval = setInterval(draw, config.speed)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [intensity, color])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: 0.6 }}
    />
  )
}