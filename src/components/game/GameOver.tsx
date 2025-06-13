"use client"

interface GameOverProps {
  finalLevel: number
  totalScore: number
  totalTime: number
  onRestart: () => void
}

export default function GameOver({ finalLevel, totalScore, totalTime, onRestart }: GameOverProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-3xl font-bold mb-8 text-white">Experiment Complete!</h2>

      <div className="space-y-4 mb-8">
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
          <div className="text-3xl font-bold">{finalLevel}</div>
          <div className="text-sm text-gray-400 mt-1">Final Level Reached</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
          <div className="text-3xl font-bold">{totalScore}</div>
          <div className="text-sm text-gray-400 mt-1">Total Score</div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
          <div className="text-3xl font-bold">{formatTime(totalTime)}</div>
          <div className="text-sm text-gray-400 mt-1">Total Time</div>
        </div>
      </div>

      <div className="text-gray-300 mb-8">
        <p className="mb-2 text-lg">Thank you for participating in our color perception study!</p>
        <p className="text-sm text-gray-400">Your anonymous data helps us understand human color perception better.</p>
      </div>

      <div className="h-px bg-gray-700/20 my-8"></div>
        <button
          onClick={onRestart}
          className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-2 px-8 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
        >
          Play Again
        </button>
    </div>
  )
}
