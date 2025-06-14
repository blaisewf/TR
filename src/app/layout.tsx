import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import AntiCheat from "@/components/layout/AntiCheat";
import Navigation from "@/components/layout/Navigation";
import I18nProvider from "@/components/providers/I18nProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL("https://trcolors.vercel.app/"), // TODO: replace with the actual domain
	title: "Color Perception Experiment | Interactive Color Study",
	description:
		"Participate in a large-scale study on color perception and help researchers better understand how individuals perceive colors differently.",
	keywords:
		"color perception, color experiment, color science, color models, RGB, CIELAB, Oklab, CIECAM02-UCS, interactive study, color vision test",
	openGraph: {
		title: "Color Perception Experiment | Interactive Color Study",
		description:
			"Participate in a large-scale study on color perception and help researchers better understand how individuals perceive colors differently.",
		type: "website",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 500,
				alt: "Color Perception Experiment | Interactive Color Study",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Color Perception Experiment | Interactive Color Study",
		description:
			"Participate in a large-scale study on color perception and help researchers better understand how individuals perceive colors differently.",
		images: ["/og-image.jpg"],
	},
	other: {
		"og:site_name": "Color Perception Experiment",
		"og:locale": "en_US",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="overflow-y-scroll">
			<body
				className={`${geistSans.variable} ${geistMono.variable}`}
				suppressHydrationWarning
			>
				<I18nProvider>
					<AntiCheat />
					<Navigation />
					<main>{children}</main>
				</I18nProvider>
			</body>
		</html>
	);
}
