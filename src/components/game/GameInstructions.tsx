"use client";

import { useTranslation } from 'react-i18next';

interface GameInstructionsProps {
	onStartGame: () => void;
}

export default function GameInstructions({
	onStartGame,
}: GameInstructionsProps) {
	const { t } = useTranslation();

	return (
		<div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-10 bg-gray-800/20 backdrop-blur-md rounded-2xl border border-gray-700/20 shadow-lg">
			<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-white">
				{t('game.instructions.title')}
			</h1>

			<div className="space-y-4 sm:space-y-6 text-white/90 mb-6 sm:mb-8 md:mb-10">
				<p className="text-base sm:text-lg text-gray-300">
					{t('game.instructions.description')}
				</p>

				<div className="bg-gray-800/20 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-gray-700/20">
					<h2 className="font-semibold text-lg sm:text-xl text-white mb-2 sm:mb-3">{t('game.instructions.howToPlay')}</h2>
					<ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-300">
						<li>{t('game.instructions.steps.1')}</li>
						<li>{t('game.instructions.steps.2')}</li>
						<li>{t('game.instructions.steps.3')}</li>
						<li>{t('game.instructions.steps.4')}</li>
					</ul>
				</div>

				<div className="bg-gray-800/20 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-gray-700/20">
					<h2 className="font-semibold text-lg sm:text-xl text-white mb-2 sm:mb-3">
						{t('game.instructions.whatWeStudy')}
					</h2>
					<p className="text-sm sm:text-base text-gray-300">
						{t('game.instructions.studyDescription')}
					</p>
				</div>

				<div className="bg-gray-800/20 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-gray-700/20">
					<h2 className="font-semibold text-lg sm:text-xl text-white mb-2 sm:mb-3">{t('game.instructions.privacy')}</h2>
					<p className="text-sm sm:text-base text-gray-300">
						{t('game.instructions.privacyDescription')}
					</p>
				</div>
			</div>

			<div className="h-px bg-gray-700/20 my-6 sm:my-8"></div>
			<div className="text-center">
				<button
					onClick={onStartGame}
					className="w-full sm:w-auto bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-2 px-6 sm:px-8 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
				>
					{t('buttons.start')}
				</button>
			</div>
		</div>
	);
}
