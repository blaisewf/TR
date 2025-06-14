"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import caTranslation from "../translations/ca.json";
import enTranslation from "../translations/en.json";
import esTranslation from "../translations/es.json";

if (!i18n.isInitialized) {
	i18n
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			fallbackLng: "en",
			debug: process.env.NODE_ENV === "development",
			interpolation: {
				escapeValue: false,
			},
			resources: {
				en: {
					translation: enTranslation,
				},
				ca: {
					translation: caTranslation,
				},
				es: {
					translation: esTranslation,
				},
			},
		});
}

export default i18n;
