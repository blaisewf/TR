"use client";

interface GameStatsProps {
	level: number;
	score: number;
	timeElapsed: number;
	colorModel: string;
}

export default function GameStats({
	level,
	score,
	timeElapsed,
	colorModel,
}: GameStatsProps) {
	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl border border-gray-700/50">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
				<div className="p-2 sm:p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
					<div className="text-xl sm:text-2xl font-bold">{level}</div>
					<div className="text-xs sm:text-sm text-gray-400 mt-1">Level</div>
				</div>
				<div className="p-2 sm:p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
					<div className="text-xl sm:text-2xl font-bold">{score}</div>
					<div className="text-xs sm:text-sm text-gray-400 mt-1">Score</div>
				</div>
				<div className="p-2 sm:p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
					<div className="text-xl sm:text-2xl font-bold">{formatTime(timeElapsed)}</div>
					<div className="text-xs sm:text-sm text-gray-400 mt-1">Time</div>
				</div>
				<div className="p-2 sm:p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
					<div className="text-base sm:text-lg font-bold">{colorModel}</div>
					<div className="text-xs sm:text-sm text-gray-400 mt-1">Color Model</div>
				</div>
			</div>
		</div>
	);
}
