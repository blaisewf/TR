// game state types
export type GameState = "instructions" | "playing" | "game-over";
export type ColorModel = "RGB" | "CIELAB" | "JzAzBz" | "Oklab";

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
export const COLOR_MODELS: ColorModel[] = ["RGB", "CIELAB", "JzAzBz", "Oklab"];
export const COLOR_MODEL_DISPLAY_NAMES: Record<ColorModel, string> = {
	RGB: "RGB",
	CIELAB: "CIELAB",
	JzAzBz: "JzAzBz",
	Oklab: "Oklab",
};
export const GRID_SIZE = 4;
export const MAX_WRONG_ANSWERS = 3;
