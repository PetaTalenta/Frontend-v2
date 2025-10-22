import React from "react"

interface ProgressProps {
  value?: number
  max?: number
  className?: string
  style?: React.CSSProperties
}

export function Progress({ value = 0, max = 100, className, style }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuemin={0}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className || ''}`}
      style={style}
    >
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: (style as any)?.['--progress-background'] || '#6475e9'
        }}
      />
    </div>
  )
}