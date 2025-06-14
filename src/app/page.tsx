"use client";

import GameBoard from "@/components/game/GameBoard";
import GameInstructions from "@/components/game/GameInstructions";
import GameOver from "@/components/game/GameOver";
import Background from "@/components/layout/Background";
import { useGame } from "@/hooks/useGame";
import { useEffect, useState } from "react";

export default function ColorPerceptionGame() {
	const [isClient, setIsClient] = useState(false);
	const {
		gameState,
		currentRound,
		level,
		score,
		wrongAnswers,
		elapsedTime,
		startGame,
		handleSquareClick,
	} = useGame();

	// initialize client-side state
	useEffect(() => {
		setIsClient(true);
	}, []);

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
						{gameState === "instructions" && (
							<GameInstructions onStartGame={startGame} />
						)}

						{gameState === "playing" && currentRound && (
							<GameBoard
								currentRound={currentRound}
								level={level}
								score={score}
								timeElapsed={elapsedTime}
								wrongAnswers={wrongAnswers}
								onSquareClick={handleSquareClick}
							/>
						)}

						{gameState === "game-over" && (
							<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
								<GameOver
									finalLevel={level}
									totalScore={score}
									totalTime={elapsedTime}
									onRestart={startGame}
								/>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
