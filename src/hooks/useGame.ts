import {
	type GameSessionData,
	type RoundData,
	saveCompleteSession,
} from "@/lib/database/supabase";
import {
	createPerceptualDifference,
	generateRandomRGBColor,
} from "@/lib/utils/colorGenerator";
import { getDeviceInfo } from "@/lib/utils/deviceClassifier";
import { getPlayerId } from "@/lib/utils/playerId";
import { generateUUID } from "@/lib/utils/uuidGenerator";
import {
	COLOR_MODELS,
	GRID_SIZE,
	type GameRound,
	type GameState,
	MAX_WRONG_ANSWERS,
} from "@/types/game";
import { useCallback, useEffect, useState } from "react";

export const useGame = () => {
	const [gameState, setGameState] = useState<GameState>("instructions");
	const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
	const [level, setLevel] = useState(1);
	const [score, setScore] = useState(0);
	const [wrongAnswers, setWrongAnswers] = useState(0);
	const [gameStartTime, setGameStartTime] = useState(0);
	const [sessionId, setSessionId] = useState<string>("");
	const [rounds, setRounds] = useState<RoundData[]>([]);
	const [elapsedTime, setElapsedTime] = useState(0);

	// calculate difficulty based on level
	const getDifficulty = (level: number): number => {
		return Math.max(0.1, 1.0 - (level - 1) * 0.1);
	};

	// generate new round
	const generateRound = useCallback((level: number): GameRound => {
		const baseColor = generateRandomRGBColor();
		const colorModel =
			COLOR_MODELS[Math.floor(Math.random() * COLOR_MODELS.length)];
		const difficulty = getDifficulty(level);
		const changedColor = createPerceptualDifference(
			baseColor,
			colorModel,
			difficulty,
		);

		const changedPosition: [number, number] = [
			Math.floor(Math.random() * GRID_SIZE),
			Math.floor(Math.random() * GRID_SIZE),
		];

		return {
			level,
			baseColor,
			changedColor,
			colorModel,
			changedPosition,
			startTime: Date.now(),
		};
	}, []);

	// start new game
	const startGame = useCallback(() => {
		setGameState("playing");
		setLevel(1);
		setScore(0);
		setWrongAnswers(0);
		setGameStartTime(Date.now());
		setRounds([]);
		setSessionId(generateUUID());
		setCurrentRound(generateRound(1));
	}, [generateRound]);

	// handle square click
	const handleSquareClick = useCallback(
		async (clickPosition: [number, number], clickCoords: [number, number]) => {
			if (!currentRound) return;

			const endTime = Date.now();
			const timeTaken = (endTime - currentRound.startTime) / 1000;
			const correct =
				clickPosition[0] === currentRound.changedPosition[0] &&
				clickPosition[1] === currentRound.changedPosition[1];

			const roundData: RoundData = {
				level: currentRound.level,
				base_color: currentRound.baseColor,
				changed_color: currentRound.changedColor,
				color_model: currentRound.colorModel,
				changed_position: currentRound.changedPosition,
				click_position: clickPosition,
				click_coords: clickCoords,
				time: timeTaken,
				correct,
			};

			const updatedRounds = [...rounds, roundData];
			setRounds(updatedRounds);

			if (correct) {
				setScore((prev) => prev + 1);
				setLevel((prev) => prev + 1);
				setTimeout(() => {
					setCurrentRound(generateRound(level + 1));
				}, 1000);
			} else {
				const newWrongAnswers = wrongAnswers + 1;
				setWrongAnswers(newWrongAnswers);

				if (newWrongAnswers >= MAX_WRONG_ANSWERS) {
					const totalTime = (Date.now() - gameStartTime) / 1000;
					const completeSessionData: GameSessionData = {
						session_id: sessionId,
						player_id: getPlayerId(),
						total_time: totalTime,
						final_level: level,
						rounds: updatedRounds,
						device_info: getDeviceInfo(),
					};

					try {
						await saveCompleteSession(completeSessionData);
						console.log("Complete session saved:", completeSessionData);
					} catch (error) {
						console.error("Failed to save complete session:", error);
					}

					setGameState("game-over");
				} else {
					setTimeout(() => {
						setCurrentRound(generateRound(level));
					}, 1000);
				}
			}
		},
		[
			currentRound,
			sessionId,
			level,
			wrongAnswers,
			gameStartTime,
			generateRound,
			rounds,
		],
	);

	// update elapsed time
	useEffect(() => {
		if (gameState === "playing") {
			const interval = setInterval(() => {
				setElapsedTime((Date.now() - gameStartTime) / 1000);
			}, 100);
			return () => clearInterval(interval);
		}
	}, [gameState, gameStartTime]);

	return {
		gameState,
		currentRound,
		level,
		score,
		wrongAnswers,
		elapsedTime,
		startGame,
		handleSquareClick,
	};
};
