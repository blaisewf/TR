// game state types
export type GameState = "instructions" | "playing" | "game-over";
export type ColorModel = "RGB" | "CIELAB" | "CIECAM02-UCS" | "Oklab";

// game round interface
export interface GameRound {
	level: number;
	baseColor: [number, number, number];
	changedColor: [number, number, number];
	colorModel: ColorModel;
	changedPosition: [number, number];
	startTime: number;
}

// game constants
export const COLOR_MODELS: ColorModel[] = [
	"RGB",
	"CIELAB",
	"CIECAM02-UCS",
	"Oklab",
];
export const COLOR_MODEL_DISPLAY_NAMES: Record<ColorModel, string> = {
	RGB: "RGB",
	CIELAB: "CIELAB",
	"CIECAM02-UCS": "CAM02",
	Oklab: "Oklab",
};
export const GRID_SIZE = 4;
export const MAX_WRONG_ANSWERS = 3;
