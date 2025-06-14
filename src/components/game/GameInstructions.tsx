"use client";

interface GameInstructionsProps {
	onStartGame: () => void;
}

export default function GameInstructions({
	onStartGame,
}: GameInstructionsProps) {
	return (
		<div className="max-w-2xl mx-auto p-10 bg-gray-800/20 backdrop-blur-md rounded-2xl border border-gray-700/20 shadow-lg">
			<h1 className="text-4xl font-bold text-center mb-8 text-white">
				Color Perception Experiment
			</h1>

			<div className="space-y-6 text-white/90 mb-10">
				<p className="text-lg text-gray-300">
					Welcome to our interactive color perception study! This experiment
					investigates how humans perceive color differences across various
					digital color models.
				</p>

				<div className="bg-gray-800/20 backdrop-blur-md p-6 rounded-xl border border-gray-700/20">
					<h2 className="font-semibold text-xl text-white mb-3">How to Play</h2>
					<ul className="list-disc list-inside space-y-2 text-gray-300">
						<li>You'll see a grid of colored squares</li>
						<li>One square will be slightly different from the others</li>
						<li>Click on the square that looks different</li>
						<li>The game gets harder as you progress</li>
					</ul>
				</div>

				<div className="bg-gray-800/20 backdrop-blur-md p-6 rounded-xl border border-gray-700/20">
					<h2 className="font-semibold text-xl text-white mb-3">
						What We're Studying
					</h2>
					<p className="text-gray-300">
						Different color models (RGB, CIELAB, Oklab, CIECAM02-UCS) represent
						colors in various ways. We're collecting data to understand which
						models best match human color perception.
					</p>
				</div>

				<div className="bg-gray-800/20 backdrop-blur-md p-6 rounded-xl border border-gray-700/20">
					<h2 className="font-semibold text-xl text-white mb-3">Privacy</h2>
					<p className="text-gray-300">
						Your data is collected anonymously. We only store your responses,
						timing, and basic device information. No personal information is
						collected.
					</p>
				</div>
			</div>

			<div className="text-center">
				<div className="h-px bg-gray-700/20 my-8"></div>
				<button
					onClick={onStartGame}
					className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-2 px-8 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
				>
					Start Experiment
				</button>
			</div>
		</div>
	);
}
