"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

interface GameInstructionsProps {
	onStartGame: (hasVisibilityCondition: boolean) => void;
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
	const [hasVisibilityCondition, setHasVisibilityCondition] = useState(false);
	const [showVisibilityDetails, setShowVisibilityDetails] = useState(false);

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) {
			setShowVisibilityDetails(true);
		} else {
			setHasVisibilityCondition(false);
			setShowVisibilityDetails(false);
		}
	};

	const handleVisibilityConfirm = () => {
		setHasVisibilityCondition(true);
		setShowVisibilityDetails(false);
	};

	return (
		<div className="max-w-3xl mx-auto p-5 sm:p-6 md:p-10 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-md rounded-2xl border border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300">
			<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-8 md:mb-10 text-white">
				{t("game.instructions.title")}
			</h1>

			<div className="space-y-4 sm:space-y-8 text-white/90 mb-6">
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

			<div className="h-px bg-gray-700/20 my-3"></div>
			<div className="space-y-3">
				<div>
					<div className="p-2">
						<div className="flex items-center gap-3 opacity-75 hover:opacity-100 transition-opacity duration-200">
							<div className="relative">
								<input
									type="checkbox"
									id="visibility-condition"
									checked={hasVisibilityCondition}
									onChange={handleVisibilityChange}
									className="peer absolute inset-0 w-5 h-5 opacity-0 cursor-pointer z-10"
								/>
								<div className="w-5 h-5 border-2 border-gray-600 rounded-md bg-gray-800/30 backdrop-blur-sm peer-checked:bg-blue-400 peer-checked:border-blue-400 transition-all duration-200 flex items-center justify-center">
									{hasVisibilityCondition && (
										<svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
											<path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									)}
								</div>
							</div>
							<label
								htmlFor="visibility-condition"
								className="text-sm text-gray-300 cursor-pointer select-none"
							>
								{t("game.instructions.hasVisibilityCondition")}
							</label>
						</div>

						<div className={`overflow-hidden transition-all duration-300 ${showVisibilityDetails ? "max-h-96 mt-4" : "max-h-0"}`}>
							<div className="space-y-4">
								<div className="flex gap-4">
									<div className="flex-1 p-3 bg-gray-800/10 rounded-lg border border-green-500/20">
										<div className="flex items-center gap-2 mb-2">
											<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#4ade80">
												<path d="m382-354 339-339q12-12 28-12t28 12q12 12 12 28.5T777-636L410-268q-12 12-28 12t-28-12L182-440q-12-12-11.5-28.5T183-497q12-12 28.5-12t28.5 12l142 143Z"/>
											</svg>
											<h3 className="text-green-400 text-sm font-medium">{t("game.instructions.visibility.consideredConditions")}</h3>
										</div>
										<ul className="space-y-1 text-xs text-gray-300">
											<li className="flex items-center gap-2">
												<span className="text-green-400">•</span>
												{t("game.instructions.visibility.conditions.colorBlindness")}
											</li>
											<li className="flex items-center gap-2">
												<span className="text-green-400">•</span>
												{t("game.instructions.visibility.conditions.screenReaders")}
											</li>
											<li className="flex items-center gap-2">
												<span className="text-green-400">•</span>
												{t("game.instructions.visibility.conditions.lowVision")}
											</li>
											<li className="flex items-center gap-2">
												<span className="text-green-400">•</span>
												{t("game.instructions.visibility.conditions.blindness")}
											</li>
										</ul>
									</div>

									<div className="flex-1 p-3 bg-gray-800/10 rounded-lg border border-red-500/20">
										<div className="flex items-center gap-2 mb-2">
											<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#f87171">
												<path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
											</svg>
											<h3 className="text-red-400 text-sm font-medium">{t("game.instructions.visibility.notConsidered")}</h3>
										</div>
										<ul className="space-y-1 text-xs text-gray-300">
											<li className="flex items-center gap-2">
												<span className="text-red-400">•</span>
												{t("game.instructions.visibility.notConsideredConditions.glasses")}
											</li>
											<li className="flex items-center gap-2">
												<span className="text-red-400">•</span>
												{t("game.instructions.visibility.notConsideredConditions.temporary")}
											</li>
											<li className="flex items-center gap-2">
												<span className="text-red-400">•</span>
												{t("game.instructions.visibility.notConsideredConditions.eyeStrain")}
											</li>
										</ul>
									</div>
								</div>

								<p className="text-xs text-gray-400 text-left">
									{t("game.instructions.visibility.confirmMessage")}
								</p>

								<div className="flex justify-left gap-3">
									<button
										onClick={handleVisibilityConfirm}
										className="bg-white backdrop-blur-md text-black hover:bg-white/70 font-medium py-1.5 px-4 rounded-full text-xs shadow-lg transition-all duration-300 cursor-pointer"
									>
										{t("game.instructions.visibility.confirm")}
									</button>
									<button
										onClick={() => setShowVisibilityDetails(false)}
										className="text-gray-400 hover:text-white text-xs transition-colors duration-200 cursor-pointer"
									>
										{t("game.instructions.visibility.cancel")}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="text-center">
					<button
						onClick={() => onStartGame(hasVisibilityCondition)}
						className="w-full sm:w-auto bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-3 px-6 sm:px-8 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
					>
						{t("buttons.start")}
					</button>
				</div>
			</div>
		</div>
	);
}
