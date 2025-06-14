"use client";

import { useEffect, useState } from "react";

export default function AntiCheat() {
	const [showWarning, setShowWarning] = useState(false);
	const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
	const [isKeybindWarning, setIsKeybindWarning] = useState(false);

	useEffect(() => {
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

		// prevent devtools detection
		const handleDevTools = () => {
			if (window.innerWidth - document.documentElement.clientWidth > 0) {
				setShowWarning(true);
				setIsDevToolsOpen(true);
				setIsKeybindWarning(false);
			} else {
				setIsDevToolsOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("contextmenu", handleContextMenu);
		window.addEventListener("resize", handleDevTools);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("contextmenu", handleContextMenu);
			window.removeEventListener("resize", handleDevTools);
		};
	}, []);

	if (!showWarning) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
			<div className="max-w-md mx-auto p-8 bg-gray-800/20 backdrop-blur-md rounded-2xl border border-gray-700/20 shadow-lg">
				<h2 className="text-2xl font-bold text-center mb-4 text-white">
					Warning
				</h2>
				<p className="text-gray-300 text-center mb-6">
					{isDevToolsOpen
						? "Developer tools detected! Please close them and refresh the page to continue."
						: "Please don't try to cheat! This experiment requires your honest participation."}
				</p>
				<div className="text-center">
					{isKeybindWarning && !isDevToolsOpen && (
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
