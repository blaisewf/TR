import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
	metadataBase: new URL("https://treballderecerca.cat"),
	title: "Human vs Digital Color Perception | Treball de Recerca",
	description:
		"Explore how humans perceive color compared to digital systems. This interactive research project examines color models and their alignment with real-world perception.",
	keywords:
		"color perception, color research, TDR, TR project, treballderecerca, final research project, color experiment, digital color models, human vision, RGB, CIELAB, Oklab, JzAzBz, visual perception, interactive study, TDR 2025, color accuracy, color science, research in color, high school research project",
	openGraph: {
		title: "Human vs Digital Color Perception | Treball de Recerca",
		description:
			"An in-depth study comparing human color perception to digital color models. Participate in the interactive experiment and help improve color accuracy in technology.",
		type: "website",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 500,
				alt: "Human vs Digital Color Perception | Treball de Recerca",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Human vs Digital Color Perception | Treball de Recerca",
		description:
			"Join an interactive research project comparing how humans and machines perceive color. Help shape more inclusive and accurate visual technologies.",
		images: ["/og-image.jpg"],
	},
	other: {
		"og:site_name": "Color Perception Research Project",
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
				<Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
			</body>
		</html>
	);
}
