"use client"

import { useState, useEffect, useCallback } from "react"
import ColorGrid from "@/components/game/ColorGrid"
import GameStats from "@/components/game/GameStats"
import GameInstructions from "@/components/game/GameInstructions"
import GameOver from "@/components/game/GameOver"
import Background from "@/components/layout/Background"
import { generateRandomRGBColor, createPerceptualDifference, getPlayerId, type ColorModel } from "@/lib/utils/colorGenerator"
import { saveCompleteSession, type RoundData, type GameSessionData } from "@/lib/database/supabase"
import { getDeviceInfo } from "@/lib/utils/deviceClassifier"
import { generateUUID } from "@/lib/utils/uuidGenerator"

type GameState = "instructions" | "playing" | "game-over"

interface GameRound {
  level: number
  baseColor: [number, number, number]
  changedColor: [number, number, number]
  colorModel: ColorModel
  changedPosition: [number, number]
  startTime: number
}

const COLOR_MODELS: ColorModel[] = ["RGB", "CIELAB", "CIECAM02-UCS", "Oklab"]
const GRID_SIZE = 4
const MAX_WRONG_ANSWERS = 3

export default function ColorPerceptionGame() {
  const [gameState, setGameState] = useState<GameState>("instructions")
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [gameStartTime, setGameStartTime] = useState(0)
  const [sessionId, setSessionId] = useState<string>("")
  const [rounds, setRounds] = useState<RoundData[]>([])
  const [isClient, setIsClient] = useState(false)

  // initialize client-side state
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calculate difficulty based on level (higher level = smaller differences)
  const getDifficulty = (level: number): number => {
    return Math.max(0.1, 1.0 - (level - 1) * 0.1)
  }

  // Generate a new round
  const generateRound = useCallback((level: number): GameRound => {
    // generate random values only on client side
    const baseColor = generateRandomRGBColor()
    const colorModel = COLOR_MODELS[Math.floor(Math.random() * COLOR_MODELS.length)]
    const difficulty = getDifficulty(level)
    const changedColor = createPerceptualDifference(baseColor, colorModel, difficulty)

    const changedPosition: [number, number] = [
      Math.floor(Math.random() * GRID_SIZE),
      Math.floor(Math.random() * GRID_SIZE),
    ]

    return {
      level,
      baseColor,
      changedColor,
      colorModel,
      changedPosition,
      startTime: Date.now(),
    }
  }, [])

  // Start a new game
  const startGame = useCallback(() => {
    setGameState("playing")
    setLevel(1)
    setScore(0)
    setWrongAnswers(0)
    setGameStartTime(Date.now())
    setRounds([])
    setSessionId(generateUUID())
    setCurrentRound(generateRound(1))
  }, [generateRound])

  // Handle square click
  const handleSquareClick = useCallback(
    async (clickPosition: [number, number], clickCoords: [number, number]) => {
      if (!currentRound) return

      const endTime = Date.now()
      const timeTaken = (endTime - currentRound.startTime) / 1000
      const correct =
        clickPosition[0] === currentRound.changedPosition[0] && clickPosition[1] === currentRound.changedPosition[1]

      // Create round data
      const roundData: RoundData = {
        level: currentRound.level,
        base_color: currentRound.baseColor,
        changed_color: currentRound.changedColor,
        color_model: currentRound.colorModel,
        changed_position: currentRound.changedPosition,
        click_position: clickPosition,
        click_coords: clickCoords,
        time: timeTaken,
        correct,
      }

      // Add round to local state
      const updatedRounds = [...rounds, roundData]
      setRounds(updatedRounds)

      if (correct) {
        setScore((prev) => prev + 1)
        setLevel((prev) => prev + 1)
        // Generate next round with increased difficulty
        setTimeout(() => {
          setCurrentRound(generateRound(level + 1))
        }, 1000)
      } else {
        const newWrongAnswers = wrongAnswers + 1
        setWrongAnswers(newWrongAnswers)

        if (newWrongAnswers >= MAX_WRONG_ANSWERS) {
          // Game over - save complete session data
          const totalTime = (Date.now() - gameStartTime) / 1000

          const completeSessionData: GameSessionData = {
            session_id: sessionId,
            player_id: getPlayerId(),
            total_time: totalTime,
            final_level: level,
            rounds: updatedRounds,
            device_info: getDeviceInfo()
          }

          try {
            await saveCompleteSession(completeSessionData)
            console.log("Complete session saved:", completeSessionData)
          } catch (error) {
            console.error("Failed to save complete session:", error)
          }

          setGameState("game-over")
        } else {
          // Continue with same level
          setTimeout(() => {
            setCurrentRound(generateRound(level))
          }, 1000)
        }
      }
    },
    [currentRound, sessionId, level, wrongAnswers, gameStartTime, generateRound, rounds],
  )

  // Calculate elapsed time
  const [elapsedTime, setElapsedTime] = useState(0)
  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(() => {
        setElapsedTime((Date.now() - gameStartTime) / 1000)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [gameState, gameStartTime])

  return (
    <div className="min-h-screen bg-black/50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
      <Background />
      <div className="max-w-4xl w-full mx-auto space-y-8 relative">
        {!isClient ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {gameState === "instructions" && <GameInstructions onStartGame={startGame} />}

            {gameState === "playing" && currentRound && (
              <div className="space-y-8">
                <GameStats level={level} score={score} timeElapsed={elapsedTime} colorModel={currentRound.colorModel} />

                <div className="text-center bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-white mb-2">Find the different colored square</h2>
                    <p className="text-sm text-gray-400">
                      Wrong answers: <span className="text-red-400">{wrongAnswers}</span>/{MAX_WRONG_ANSWERS}
                    </p>
                  </div>

                  <div className="p-6 rounded-xl">
                    <ColorGrid
                      gridSize={GRID_SIZE}
                      baseColor={currentRound.baseColor}
                      changedColor={currentRound.changedColor}
                      changedPosition={currentRound.changedPosition}
                      onSquareClick={handleSquareClick}
                    />
                  </div>
                </div>
              </div>
            )}

            {gameState === "game-over" && (
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
                <GameOver finalLevel={level} totalScore={score} totalTime={elapsedTime} onRestart={startGame} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
