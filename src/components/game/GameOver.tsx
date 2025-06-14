"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";

interface GameOverProps {
	finalLevel: number;
	totalScore: number;
	totalTime: number;
	onRestart: () => void;
}

export default function GameOver({
	finalLevel,
	totalScore,
	totalTime,
	onRestart,
}: GameOverProps) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [showConfetti, setShowConfetti] = useState(true);
	const [shareError, setShareError] = useState(false);
	const [confettiOpacity, setConfettiOpacity] = useState(0);

	useEffect(() => {
		// set initial dimensions
		const updateDimensions = () => {
			setDimensions({
				width: document.documentElement.clientWidth,
				height: document.documentElement.clientHeight,
			});
		};

		updateDimensions();

		// handle window resize
		window.addEventListener("resize", updateDimensions);

		// fade in confetti
		setConfettiOpacity(1);

		// stop confetti after 5 seconds
		const timer = setTimeout(() => {
			setShowConfetti(false);
		}, 5000);

		return () => {
			window.removeEventListener("resize", updateDimensions);
			clearTimeout(timer);
		};
	}, []);

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const copyToClipboard = async (text: string): Promise<boolean> => {
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
				return true;
			}

			// fallback for non-secure contexts
			const textArea = document.createElement("textarea");
			textArea.value = text;
			// hide textarea off-screen
			textArea.style.position = "fixed";
			textArea.style.left = "-9999px";
			textArea.style.top = "-9999px";
			document.body.appendChild(textArea);
			textArea.select();
			const success = document.execCommand("copy");
			textArea.remove();
			return success;
		} catch (err) {
			console.error("Copy failed:", err);
			return false;
		}
	};

	const handleShare = async () => {
		const shareText = t("game.gameOver.shareText", {
			level: finalLevel,
			score: totalScore,
			time: formatTime(totalTime),
		});
		const shareUrl = window.location.href;
		const fullText = `${shareText}\n${shareUrl}`;

		// try native share first
		if (navigator.share && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
			try {
				await navigator.share({
					title: t("game.instructions.title"),
					text: shareText,
					url: shareUrl,
				});
				return;
			} catch (err) {
				console.error("Share failed:", err);
			}
		}

		// fallback to copy
		const success = await copyToClipboard(fullText);
		setCopied(success);
		setShareError(!success);
		setTimeout(() => {
			setCopied(false);
			setShareError(false);
		}, 2000);
	};

	return (
		<>
			<div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-10 relative">
				{showConfetti && (
					<div
						className="absolute inset-0 overflow-hidden transition-opacity duration-1000"
						style={{ opacity: confettiOpacity }}
					>
						<Confetti
							width={dimensions.width}
							height={dimensions.height}
							recycle={false}
							numberOfPieces={200}
							gravity={0.2}
						/>
					</div>
				)}
				<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-white">
					{t("game.gameOver.title")}
				</h1>

				<div className="space-y-4 sm:space-y-6 text-white/90 mb-6 sm:mb-8 md:mb-10">
					<div className="bg-gray-800/20 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-gray-700/20">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-white">
									{finalLevel}
								</div>
								<div className="text-xs sm:text-sm text-gray-400 mt-1">
									{t("game.stats.round")}
								</div>
							</div>
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-white">
									{totalScore}
								</div>
								<div className="text-xs sm:text-sm text-gray-400 mt-1">
									{t("game.stats.score")}
								</div>
							</div>
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-white">
									{formatTime(totalTime)}
								</div>
								<div className="text-xs sm:text-sm text-gray-400 mt-1">
									{t("game.stats.time")}
								</div>
							</div>
						</div>
					</div>

					<div className="bg-gray-800/20 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-gray-700/20">
						<h2 className="font-semibold text-lg sm:text-xl text-white mb-2 sm:mb-3">
							{t("game.gameOver.congratulations")}
						</h2>
						<p className="text-sm sm:text-base text-gray-300">
							{t("game.gameOver.thankYou")}
						</p>
					</div>
				</div>

				<div className="h-px bg-gray-700/20 my-6 sm:my-8"></div>
				<div className="flex flex-col items-center gap-3 sm:gap-4">
					<button
						onClick={onRestart}
						className="w-full sm:w-auto bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-2 px-6 sm:px-8 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
					>
						{t("game.gameOver.playAgain")}
					</button>

					<button
						onClick={handleShare}
						className="text-gray-400 hover:text-white text-sm transition-colors duration-300 flex items-center gap-2 cursor-pointer"
					>
						{copied ? (
							<span>{t("common.copied")}</span>
						) : shareError ? (
							<span>{t("common.copyFailed")}</span>
						) : (
							<>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									height="16px"
									viewBox="0 -960 960 960"
									width="16px"
									fill="currentColor"
								>
									<path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Z" />
								</svg>
								<span>{t("game.gameOver.share")}</span>
							</>
						)}
					</button>
				</div>
			</div>
		</>
	);
}
