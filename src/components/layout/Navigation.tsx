"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function Navigation() {
	const pathname = usePathname();
	const { t, i18n } = useTranslation();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
			<div className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 rounded-full px-2 py-1.5 shadow-lg">
				<div className="flex items-center space-x-1">
					<Link
						href="/"
						className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
							pathname === "/"
								? "text-white bg-gray-700/50"
								: "text-gray-300 hover:text-white hover:bg-gray-700/30"
						}`}
					>
						{t('navigation.home')}
					</Link>
					<Link
						href="/leaderboard"
						className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
							pathname === "/leaderboard"
								? "text-white bg-gray-700/50"
								: "text-gray-300 hover:text-white hover:bg-gray-700/30"
						}`}
					>
						{t('navigation.leaderboard')}
					</Link>
					<div className="h-4 w-px bg-gray-700/30 mx-1" />
					<select
						onChange={(e) => i18n.changeLanguage(e.target.value)}
						value={i18n.language}
						className="text-xs font-medium text-gray-300 hover:text-white bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
					>
						<option value="en">EN</option>
						<option value="ca">CA</option>
						<option value="es">ES</option>
					</select>
				</div>
			</div>
		</nav>
	);
}
