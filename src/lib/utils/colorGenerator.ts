import {
	clampRgb,
	converter,
	inGamut,
	random as randomColor,
	rgb,
} from "culori";

export type ColorModel = "RGB" | "CIELAB" | "JzAzBz" | "Oklab";

// Color space converters
const toRgb = converter("rgb");
const toLab = converter("lab");
const toOklab = converter("oklab");
const toJab = converter("jab");

// Color space volumes, used to keep uniformity between models
const labVol = 824204.547378;
const oklabVol = 0.054198192;
const jabVol = 0.004623475;

const labMod = Math.cbrt(labVol);
const oklabMod = Math.cbrt(oklabVol);
const jabMod = Math.cbrt(jabVol);

// Generate a random RGB color
export function generateRandomRGBColor(): [number, number, number] {
	const color = randomColor();
	const rgbColor = rgb(color);
	return [
		Math.round(rgbColor.r * 255),
		Math.round(rgbColor.g * 255),
		Math.round(rgbColor.b * 255),
	];
}

// Convert RGB array to normalized RGB object
function rgbArrayToObject(rgbArray: [number, number, number]) {
	return {
		mode: "rgb" as const,
		r: rgbArray[0] / 255,
		g: rgbArray[1] / 255,
		b: rgbArray[2] / 255,
	};
}

// Convert normalized RGB object to RGB array
function rgbObjectToArray(rgbObj: any): [number, number, number] {
	return [
		Math.round(Math.max(0, Math.min(255, rgbObj.r * 255))),
		Math.round(Math.max(0, Math.min(255, rgbObj.g * 255))),
		Math.round(Math.max(0, Math.min(255, rgbObj.b * 255))),
	];
}

// Generate a random 3D unit vector
function randomUnitVector(): [number, number, number] {
	function gaussianRandom() {
		const u = 1 - Math.random();
		const v = Math.random();
		const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
		return z;
	}

	const x = gaussianRandom();
	const y = gaussianRandom();
	const z = gaussianRandom();

	const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
	if (magnitude === 0) return randomUnitVector();

	return [x / magnitude, y / magnitude, z / magnitude];
}

// Create perceptually uniform color difference
export function createPerceptualDifference(
	baseColor: [number, number, number],
	colorModel: ColorModel,
	difficulty: number,
): [number, number, number] {
	const maxAttempts = 50;
	let attempts = 0;

	while (attempts < maxAttempts) {
		try {
			const baseRgbObj = rgbArrayToObject(baseColor);
			let modifiedColor: any;

			switch (colorModel) {
				case "RGB": {
					const [dr, dg, db] = randomUnitVector();
					modifiedColor = {
						mode: "rgb" as const,
						r: baseRgbObj.r + dr * difficulty,
						g: baseRgbObj.g + dg * difficulty,
						b: baseRgbObj.b + db * difficulty,
					};
					break;
				}

				case "CIELAB": {
					const labColor = toLab(baseRgbObj);
					if (!labColor) throw new Error("Lab conversion failed");

					const [dL, da, db] = randomUnitVector();

					const modifiedLab = {
						mode: "lab" as const,
						l: labColor.l + dL * difficulty * labMod,
						a: labColor.a + da * difficulty * labMod,
						b: labColor.b + db * difficulty * labMod,
					};

					modifiedColor = toRgb(modifiedLab);
					break;
				}

				case "Oklab": {
					const oklabColor = toOklab(baseRgbObj);
					if (!oklabColor) throw new Error("Oklab conversion failed");

					const [dL, da, db] = randomUnitVector();

					const modifiedOklab = {
						mode: "oklab" as const,
						l: oklabColor.l + dL * difficulty * oklabMod,
						a: oklabColor.a + da * difficulty * oklabMod,
						b: oklabColor.b + db * difficulty * oklabMod,
					};

					modifiedColor = toRgb(modifiedOklab);
					break;
				}

				case "JzAzBz": {
					const jabColor = toJab(baseRgbObj);
					if (!jabColor) throw new Error("Jab conversion failed");

					const [dJ, da, db] = randomUnitVector();

					const modifiedJab = {
						mode: "jab" as const,
						j: jabColor.j + dJ * difficulty * jabMod,
						a: jabColor.a + da * difficulty * jabMod,
						b: jabColor.b + db * difficulty * jabMod,
					};

					modifiedColor = toRgb(modifiedJab);
					break;
				}
			}

			if (modifiedColor && inGamut("rgb")(modifiedColor)) {
				return rgbObjectToArray(modifiedColor);
			}
		} catch (error) {
			console.warn("Color conversion attempt failed:", error);
		}

		attempts++;
	}

	// Fallback: simple RGB difference
	const [dx, dy, dz] = randomUnitVector();
	return [
		Math.max(0, Math.min(255, baseColor[0] + dx * difficulty)),
		Math.max(0, Math.min(255, baseColor[1] + dy * difficulty)),
		Math.max(0, Math.min(255, baseColor[2] + dz * difficulty)),
	];
}

// Convert RGB array to CSS color string
export function rgbToCss(rgb: [number, number, number]): string {
	return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
