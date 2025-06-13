"use client"

import React, { useRef, useState } from "react"
import { rgbToCss } from "@/lib/utils/colorGenerator"
import { motion } from "framer-motion"

interface ColorGridProps {
  gridSize: number
  baseColor: [number, number, number]
  changedColor: [number, number, number]
  changedPosition: [number, number]
  onSquareClick: (position: [number, number], coords: [number, number]) => void
  disabled?: boolean
  isColorsUpdated?: boolean
}

export default function ColorGrid({
  gridSize,
  baseColor,
  changedColor,
  changedPosition,
  onSquareClick,
  disabled = false,
  isColorsUpdated = true,
}: ColorGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [hasClicked, setHasClicked] = useState(false)

  // reset click state when position changes
  React.useEffect(() => {
    setHasClicked(false)
  }, [changedPosition])

  const handleSquareClick = (row: number, col: number, event: React.MouseEvent) => {
    if (disabled || hasClicked || !isColorsUpdated) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left + rect.width / 2
    const y = event.clientY - rect.top + rect.height / 2

    setHasClicked(true)
    onSquareClick([row, col], [Math.round(x), Math.round(y)])
  }

  const getSquareColor = (row: number, col: number): [number, number, number] => {
    if (row === changedPosition[0] && col === changedPosition[1]) {
      return changedColor
    }
    return baseColor
  }

  return (
    <div
      ref={gridRef}
      className="inline-grid gap-1 sm:gap-2 p-2 sm:p-6 bg-gray-900/50 rounded-xl"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {Array.from({ length: gridSize * gridSize }, (_, index) => {
        const row = Math.floor(index / gridSize)
        const col = index % gridSize
        const color = getSquareColor(row, col)

        return (
          <motion.button
            key={`${row}-${col}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              duration: 0.4,
              delay: (row + col) * 0.03,
              ease: [0.4, 0, 0.2, 1] // custom easing for smoother motion
            }}
            className={`
              w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border border-gray-700/50 rounded-lg
              ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:shadow-lg"}
            `}
            style={{ backgroundColor: rgbToCss(color) }}
            onClick={(e) => handleSquareClick(row, col, e)}
            disabled={disabled}
            aria-label={`Color square at row ${row + 1}, column ${col + 1}`}
          />
        )
      })}
    </div>
  )
}
