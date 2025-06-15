"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function AntiCheat() {
	const [showWarning, setShowWarning] = useState(false);
	const [isKeybindWarning, setIsKeybindWarning] = useState(false);
	const { t } = useTranslation();

	useEffect(() => {
		// disable anti-cheat in dev mode
		if (process.env.NODE_ENV === "development") {
			return;
		}

		// prevent f12, ctrl+shift+i, ctrl+shift+j, ctrl+shift+c
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === "F12" ||
				(e.ctrlKey &&
					e.shiftKey &&
					(e.key === "I" ||
						e.key === "i" ||
						e.key === "J" ||
						e.key === "j" ||
						e.key === "C" ||
						e.key === "c"))
			) {
				e.preventDefault();
				setShowWarning(true);
				setIsKeybindWarning(true);
			}
		};

		// prevent right click
		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("contextmenu", handleContextMenu);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("contextmenu", handleContextMenu);
		};
	}, []);

	if (!showWarning) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div className="max-w-md mx-auto p-8 bg-gray-800/20 backdrop-blur-md rounded-2xl border border-gray-700/20 shadow-lg">
				<h2 className="text-2xl font-bold text-center mb-4 text-white">
					{t("antiCheat.warning")}
				</h2>
				<p className="text-gray-300 text-center mb-6">
					{t("antiCheat.message")}
				</p>
				<div className="text-center">
					{isKeybindWarning && (
						<button
							onClick={() => setShowWarning(false)}
							className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-2 px-6 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
						>
							I Understand
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
