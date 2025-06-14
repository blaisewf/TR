"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

interface GameInstructionsProps {
	onStartGame: () => void;
}

export default function GameInstructions({
	onStartGame,
}: GameInstructionsProps) {
	const { t } = useTranslation();
	const [expandedSections, setExpandedSections] = useState({
		howToPlay: true,
		whatWeStudy: true,
		privacy: false,
	});

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	return (
		<div className="max-w-3xl mx-auto p-5 sm:p-6 md:p-10 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-md rounded-2xl border border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
			<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-8 md:mb-10 text-white">
				{t("game.instructions.title")}
			</h1>

			<div className="space-y-4 sm:space-y-8 text-white/90 mb-4 sm:mb-10 md:mb-12">
				<p className="text-sm sm:text-lg text-gray-300 leading-relaxed">
					{t("game.instructions.projectContext")}
				</p>

				<p className="text-sm sm:text-lg text-gray-300 leading-relaxed">
					{t("game.instructions.description")}
				</p>

				<div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-md rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-all duration-300">
					<button
						onClick={() => toggleSection("howToPlay")}
						className="w-full p-3 sm:p-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-700/10 transition-colors duration-200"
					>
						<h2 className="font-semibold text-base sm:text-xl text-white flex items-center gap-2">
							<svg
								className="w-5 h-5 text-blue-400"
								viewBox="0 -960 960 960"
								fill="currentColor"
							>
								<path d="M182-200q-51 0-79-35.5T82-322l42-300q9-60 53.5-99T282-760h396q60 0 104.5 39t53.5 99l42 300q7 51-21 86.5T778-200q-21 0-39-7.5T706-230l-90-90H344l-90 90q-15 15-33 22.5t-39 7.5Zm16-86 114-114h336l114 114q2 2 16 6 11 0 17.5-6.5T800-304l-44-308q-4-29-26-48.5T678-680H282q-30 0-52 19.5T204-612l-44 308q-2 11 4.5 17.5T182-280q2 0 16-6Zm482-154q17 0 28.5-11.5T720-480q0-17-11.5-28.5T680-520q-17 0-28.5 11.5T640-480q0 17 11.5 28.5T680-440Zm-80-120q17 0 28.5-11.5T640-600q0-17-11.5-28.5T600-640q-17 0-28.5 11.5T560-600q0 17 11.5 28.5T600-560Zm-120 80Zm-170-30v40q0 13 8.5 21.5T340-440q13 0 21.5-8.5T370-470v-40h40q13 0 21.5-8.5T440-540q0-13-8.5-21.5T410-570h-40v-40q0-13-8.5-21.5T340-640q-13 0-21.5 8.5T310-610v40h-40q-13 0-21.5 8.5T240-540q0 13 8.5 21.5T270-510h40Z" />
							</svg>
							{t("game.instructions.howToPlay")}
						</h2>
						<svg
							className={`w-5 h-5 transform transition-transform duration-300 ${expandedSections.howToPlay ? "rotate-180" : ""}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					<div
						className={`overflow-hidden transition-all duration-300 ${expandedSections.howToPlay ? "max-h-96" : "max-h-0"}`}
					>
						<div className="p-3 sm:p-4 pt-1">
							<ul className="list-none space-y-1.5 sm:space-y-2.5 text-sm sm:text-base text-gray-300 leading-relaxed">
								<li className="flex items-center gap-2">
									<span className="text-gray-300">•</span>
									{t("game.instructions.steps.1")}
								</li>
								<li className="flex items-center gap-2">
									<span className="text-gray-300">•</span>
									{t("game.instructions.steps.2")}
								</li>
								<li className="flex items-center gap-2">
									<span className="text-gray-300">•</span>
									{t("game.instructions.steps.3")}
								</li>
								<li className="flex items-center gap-2">
									<span className="text-gray-300">•</span>
									{t("game.instructions.steps.4")}
								</li>
								<li className="flex items-center gap-2">
									<span className="text-gray-300">•</span>
									{t("game.instructions.steps.5")}
								</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-md rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-all duration-300">
					<button
						onClick={() => toggleSection("whatWeStudy")}
						className="w-full p-3 sm:p-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-700/10 transition-colors duration-200"
					>
						<h2 className="font-semibold text-base sm:text-xl text-white flex items-center gap-2">
							<svg
								className="w-5 h-5 text-blue-400"
								viewBox="0 -960 960 960"
								fill="currentColor"
							>
								<path d="M200-120q-51 0-72.5-45.5T138-250l222-270v-240h-40q-17 0-28.5-11.5T280-800q0-17 11.5-28.5T320-840h320q17 0 28.5 11.5T680-800q0 17-11.5 28.5T640-760h-40v240l222 270q32 39 10.5 84.5T760-120H200Zm0-80h560L520-492v-268h-80v268L200-200Zm280-280Z" />
							</svg>
							{t("game.instructions.whatWeStudy")}
						</h2>
						<svg
							className={`w-5 h-5 transform transition-transform duration-300 ${expandedSections.whatWeStudy ? "rotate-180" : ""}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					<div
						className={`overflow-hidden transition-all duration-300 ${expandedSections.whatWeStudy ? "max-h-96" : "max-h-0"}`}
					>
						<div className="p-3 sm:p-4 pt-1">
							<p className="text-sm sm:text-base text-gray-300 leading-relaxed">
								{t("game.instructions.studyDescription")}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-md rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-all duration-300">
					<button
						onClick={() => toggleSection("privacy")}
						className="w-full p-3 sm:p-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-700/10 transition-colors duration-200"
					>
						<h2 className="font-semibold text-base sm:text-xl text-white flex items-center gap-2">
							<svg
								className="w-5 h-5 text-blue-400"
								viewBox="0 -960 960 960"
								fill="currentColor"
							>
								<path d="m438-452-56-56q-12-12-28-12t-28 12q-12 12-12 28.5t12 28.5l84 85q12 12 28 12t28-12l170-170q12-12 12-28.5T636-593q-12-12-28.5-12T579-593L438-452Zm42 368q-7 0-13-1t-12-3q-135-45-215-166.5T160-516v-189q0-25 14.5-45t37.5-29l240-90q14-5 28-5t28 5l240 90q23 9 37.5 29t14.5 45v189q0 140-80 261.5T505-88q-6 2-12 3t-13 1Zm0-80q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z" />
							</svg>
							{t("game.instructions.privacy")}
						</h2>
						<svg
							className={`w-5 h-5 transform transition-transform duration-300 ${expandedSections.privacy ? "rotate-180" : ""}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					<div
						className={`overflow-hidden transition-all duration-300 ${expandedSections.privacy ? "max-h-96" : "max-h-0"}`}
					>
						<div className="p-3 sm:p-4 pt-1">
							<p className="text-sm sm:text-base text-gray-300 leading-relaxed">
								{t("game.instructions.privacyDescription")}
							</p>
							<p className="text-sm sm:text-base text-gray-300 leading-relaxed mt-2">
								This project is open source and available on GitHub. You can review our code, contribute, or report issues at{" "}
								<a
									href="https://github.com/blaisewf/TR"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
								>
									github.com/blaisewf/TR
								</a>
								.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="h-px bg-gray-700/20 my-4 sm:my-8"></div>
			<div className="text-center">
				<button
					onClick={onStartGame}
					className="w-full sm:w-auto bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-3 px-6 sm:px-8 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
				>
					{t("buttons.start")}
				</button>
			</div>
		</div>
	);
}
