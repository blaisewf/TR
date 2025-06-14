import { generateUUID } from "./uuidGenerator";

// generate or get persistent player id
export function getPlayerId(): string {
	if (typeof window === "undefined") return generateUUID();

	const stored = localStorage.getItem("color-game-player-id");
	if (stored) return stored;

	const newId = generateUUID();
	localStorage.setItem("color-game-player-id", newId);
	return newId;
} 