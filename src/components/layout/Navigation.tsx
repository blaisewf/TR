"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Navigation() {
	const pathname = usePathname();
	const { t, i18n } = useTranslation();
	const [mounted, setMounted] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const languages = [
		{ code: "en", label: "EN" },
		{ code: "ca", label: "CA" },
		{ code: "es", label: "ES" },
	];

	return (
		<nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
			<div className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 rounded-full p-2 shadow-lg">
				<div className="flex items-center space-x-2">
					<Link
						href="/"
						className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
							pathname === "/"
								? "text-white bg-gray-700/50"
								: "text-gray-300 hover:text-white hover:bg-gray-700/30"
						}`}
					>
						{t("navigation.home")}
					</Link>
					<Link
						href="/leaderboard"
						className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
							pathname === "/leaderboard"
								? "text-white bg-gray-700/50"
								: "text-gray-300 hover:text-white hover:bg-gray-700/30"
						}`}
					>
						{t("navigation.leaderboard")}
					</Link>
					<div className="h-4 w-px bg-gray-700/30" />
					<div className="flex items-center">
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ease-out cursor-pointer ${
								isExpanded
									? "text-white bg-gray-700/50"
									: "text-gray-300 hover:text-white hover:bg-gray-700/30"
							}`}
						>
							<svg
								className="w-4 h-4 mr-1.5"
								viewBox="0 -960 960 960"
								fill="currentColor"
							>
								<path d="m603-202-34 97q-4 11-14 18t-22 7q-20 0-32.5-16.5T496-133l152-402q5-11 15-18t22-7h30q12 0 22 7t15 18l152 403q8 19-4 35.5T868-80q-13 0-22.5-7T831-106l-34-96H603ZM362-401 188-228q-11 11-27.5 11.5T132-228q-11-11-11-28t11-28l174-174q-35-35-63.5-80T190-640h84q20 39 40 68t48 58q33-33 68.5-92.5T484-720H80q-17 0-28.5-11.5T40-760q0-17 11.5-28.5T80-800h240v-40q0-17 11.5-28.5T360-880q17 0 28.5 11.5T400-840v40h240q17 0 28.5 11.5T680-760q0 17-11.5 28.5T640-720h-76q-21 72-63 148t-83 116l96 98-30 82-122-125Zm266 129h144l-72-204-72 204Z" />
							</svg>
							{i18n.language.toUpperCase()}
						</button>
						<div
							className={`flex items-center space-x-2 transition-all duration-300 ease-out overflow-hidden ${
								isExpanded
									? "w-auto opacity-100 translate-x-0 ml-2"
									: "w-0 opacity-0 -translate-x-2"
							}`}
						>
							{languages
								.filter((lang) => lang.code !== i18n.language)
								.map((lang) => (
									<button
										key={lang.code}
										onClick={() => {
											i18n.changeLanguage(lang.code);
											setIsExpanded(false);
										}}
										className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ease-out cursor-pointer text-gray-300 hover:text-white hover:bg-gray-700/30"
									>
										{lang.label}
									</button>
								))}
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
}
