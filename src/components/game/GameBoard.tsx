import type { GameRound } from "@/types/game";
import { COLOR_MODEL_DISPLAY_NAMES } from "@/types/game";
import { useTranslation } from 'react-i18next';
import ColorGrid from "./ColorGrid";
import GameStats from "./GameStats";

interface GameBoardProps {
	currentRound: GameRound;
	level: number;
	score: number;
	timeElapsed: number;
	wrongAnswers: number;
	onSquareClick: (position: [number, number], coords: [number, number]) => void;
}

export default function GameBoard({
	currentRound,
	level,
	score,
	timeElapsed,
	wrongAnswers,
	onSquareClick,
}: GameBoardProps) {
	const { t } = useTranslation();

	return (
		<div className="space-y-8">
			<GameStats
				level={level}
				score={score}
				timeElapsed={timeElapsed}
				colorModel={COLOR_MODEL_DISPLAY_NAMES[currentRound.colorModel]}
			/>

			<div className="text-center bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
				<div className="mb-6">
					<h2 className="text-2xl font-semibold text-white mb-2">
						{t('game.board.findDifferent')}
					</h2>
					<p className="text-sm text-gray-400">
						{t('game.board.wrongAnswers', { count: wrongAnswers })}
					</p>
				</div>

				<div className="p-6 rounded-xl flex justify-center">
					<ColorGrid
						gridSize={4}
						baseColor={currentRound.baseColor}
						changedColor={currentRound.changedColor}
						changedPosition={currentRound.changedPosition}
						onSquareClick={onSquareClick}
					/>
				</div>
			</div>
		</div>
	);
}
