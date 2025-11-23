"use client";

import { memo } from "react";
import GameBoard from "@/components/game/GameBoard";
import GameInstructions from "@/components/game/GameInstructions";
import GameOver from "@/components/game/GameOver";
import Background from "@/components/layout/Background";
import { useGame } from "@/hooks/useGame";

const ColorPerceptionGame = memo(function ColorPerceptionGame() {
	const {
		gameState,
		currentRound,
		level,
		score,
		wrongAnswers,
		elapsedTime,
		feedback,
		startGame,
		handleSquareClick,
	} = useGame();

	return (
		<>
			<div
				className={`fixed inset-0 pointer-events-none z-0 transition-all duration-500 ease-out ${
					feedback === "correct"
						? "shadow-[inset_0_0_120px_40px_rgba(34,197,94,0.4)] backdrop-blur-sm"
						: feedback === "wrong"
							? "shadow-[inset_0_0_120px_40px_rgba(239,68,68,0.4)] backdrop-blur-sm"
							: "opacity-0"
				}`}
				style={{
					willChange: feedback ? "opacity, box-shadow" : "auto",
				}}
			/>
			<div className="min-h-screen bg-black/50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
				<Background />
				<div className="max-w-4xl w-full mx-auto space-y-8 relative">
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
				</div>
			</div>
		</>
	);
});

export default ColorPerceptionGame;
