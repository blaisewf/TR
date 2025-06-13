import { rgb, converter, clampRgb, inGamut, random as randomColor } from "culori"
import { generateUUID } from "./uuidGenerator"

export type ColorModel = "RGB" | "CIELAB" | "CIECAM02-UCS" | "Oklab"

// Color space converters
const rgbToLab = converter("lab")
const labToRgb = converter("rgb")
const rgbToOklab = converter("oklab")
const oklabToRgb = converter("rgb")

// Generate a random RGB color
export function generateRandomRGBColor(): [number, number, number] {
  const color = randomColor()
  const rgbColor = rgb(color)
  return [Math.round(rgbColor.r * 255), Math.round(rgbColor.g * 255), Math.round(rgbColor.b * 255)]
}

// Convert RGB array to normalized RGB object
function rgbArrayToObject(rgbArray: [number, number, number]) {
  return {
    mode: "rgb" as const,
    r: rgbArray[0] / 255,
    g: rgbArray[1] / 255,
    b: rgbArray[2] / 255,
  }
}

// Convert normalized RGB object to RGB array
function rgbObjectToArray(rgbObj: any): [number, number, number] {
  return [
    Math.round(Math.max(0, Math.min(255, rgbObj.r * 255))),
    Math.round(Math.max(0, Math.min(255, rgbObj.g * 255))),
    Math.round(Math.max(0, Math.min(255, rgbObj.b * 255))),
  ]
}

// Generate a random 3D unit vector
function randomUnitVector(): [number, number, number] {
  const x = (Math.random() - 0.5) * 2
  const y = (Math.random() - 0.5) * 2
  const z = (Math.random() - 0.5) * 2

  const length = Math.sqrt(x * x + y * y + z * z)
  if (length === 0) return randomUnitVector()

  return [x / length, y / length, z / length]
}

// Create perceptually uniform color difference
export function createPerceptualDifference(
  baseColor: [number, number, number],
  colorModel: ColorModel,
  difficulty: number,
): [number, number, number] {
  const maxAttempts = 50
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const baseRgbObj = rgbArrayToObject(baseColor)
      let modifiedColor: any

      switch (colorModel) {
        case "RGB": {
          const [dx, dy, dz] = randomUnitVector()
          const scale = difficulty * 50
          modifiedColor = {
            mode: "rgb" as const,
            r: Math.max(0, Math.min(1, baseRgbObj.r + (dx * scale) / 255)),
            g: Math.max(0, Math.min(1, baseRgbObj.g + (dy * scale) / 255)),
            b: Math.max(0, Math.min(1, baseRgbObj.b + (dz * scale) / 255)),
          }
          break
        }

        case "CIELAB": {
          const labColor = rgbToLab(baseRgbObj)
          if (!labColor) throw new Error("Lab conversion failed")

          const [dL, da, db] = randomUnitVector()
          const scale = difficulty * 20

          const modifiedLab = {
            mode: "lab" as const,
            l: Math.max(0, Math.min(100, labColor.l + dL * scale)),
            a: labColor.a + da * scale,
            b: labColor.b + db * scale,
          }

          modifiedColor = labToRgb(modifiedLab)
          break
        }

        case "Oklab": {
          const oklabColor = rgbToOklab(baseRgbObj)
          if (!oklabColor) throw new Error("Oklab conversion failed")

          const [dL, da, db] = randomUnitVector()
          const scale = difficulty * 0.1

          const modifiedOklab = {
            mode: "oklab" as const,
            l: Math.max(0, Math.min(1, oklabColor.l + dL * scale)),
            a: oklabColor.a + da * scale,
            b: oklabColor.b + db * scale,
          }

          modifiedColor = oklabToRgb(modifiedOklab)
          break
        }

        case "CIECAM02-UCS": {
          const labColor = rgbToLab(baseRgbObj)
          if (!labColor) throw new Error("Lab conversion failed")

          const [dL, da, db] = randomUnitVector()
          const scale = difficulty * 15

          const modifiedLab = {
            mode: "lab" as const,
            l: Math.max(0, Math.min(100, labColor.l + dL * scale)),
            a: labColor.a + da * scale,
            b: labColor.b + db * scale,
          }

          modifiedColor = labToRgb(modifiedLab)
          break
        }
      }

      if (modifiedColor && inGamut("rgb")(modifiedColor)) {
        return rgbObjectToArray(modifiedColor)
      }

      if (modifiedColor) {
        const clampedColor = clampRgb(modifiedColor)
        const result = rgbObjectToArray(clampedColor)

        const diff =
          Math.abs(result[0] - baseColor[0]) + Math.abs(result[1] - baseColor[1]) + Math.abs(result[2] - baseColor[2])

        if (diff > 3) {
          return result
        }
      }
    } catch (error) {
      console.warn("Color conversion attempt failed:", error)
    }

    attempts++
  }

  // Fallback: simple RGB difference
  const [dx, dy, dz] = randomUnitVector()
  const scale = Math.max(5, difficulty * 30)
  return [
    Math.max(0, Math.min(255, baseColor[0] + dx * scale)),
    Math.max(0, Math.min(255, baseColor[1] + dy * scale)),
    Math.max(0, Math.min(255, baseColor[2] + dz * scale)),
  ]
}

// Convert RGB array to CSS color string
export function rgbToCss(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

// Generate or get persistent player ID
export function getPlayerId(): string {
  if (typeof window === "undefined") return generateUUID()

  const stored = localStorage.getItem("color-game-player-id")
  if (stored) return stored

  const newId = generateUUID()
  localStorage.setItem("color-game-player-id", newId)
  return newId
}
