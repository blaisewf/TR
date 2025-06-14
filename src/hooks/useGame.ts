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
	const [preloadedRound, setPreloadedRound] = useState<GameRound | null>(null);
	const [level, setLevel] = useState(1);
	const [score, setScore] = useState(0);
	const [wrongAnswers, setWrongAnswers] = useState(0);
	const [gameStartTime, setGameStartTime] = useState(0);
	const [sessionId, setSessionId] = useState<string>("");
	const [rounds, setRounds] = useState<RoundData[]>([]);
	const [elapsedTime, setElapsedTime] = useState(0);

	// calculate difficulty based on level
	const getDifficulty = (level: number): number => {
		return Math.max(1, 50 - level * 1.5) / 255;
	};

	// end game and save session
	const endGame = useCallback(async () => {
		const totalTime = (Date.now() - gameStartTime) / 1000;
		const completeSessionData: GameSessionData = {
			session_id: sessionId,
			player_id: getPlayerId(),
			total_time: totalTime,
			final_level: level,
			rounds: rounds,
			device_info: getDeviceInfo(),
		};

		try {
			await saveCompleteSession(completeSessionData);
		} catch (error) {
			console.error("Failed to save complete session:", error);
		}

		setGameState("game-over");
	}, [sessionId, gameStartTime, level, rounds]);

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

	// preload next round
	const preloadNextRound = useCallback(() => {
		const nextLevel = level + 1;
		const nextRound = generateRound(nextLevel);
		setPreloadedRound(nextRound);
	}, [level, generateRound]);

	// start new round
	const startNewRound = useCallback(() => {
		if (preloadedRound) {
			setCurrentRound(preloadedRound);
			setPreloadedRound(null);
			preloadNextRound();
		} else {
			const newRound = generateRound(level);
			setCurrentRound(newRound);
			preloadNextRound();
		}
	}, [level, preloadedRound, generateRound, preloadNextRound]);

	// initialize game
	const startGame = useCallback(() => {
		setGameState("playing");
		setLevel(1);
		setScore(0);
		setWrongAnswers(0);
		setGameStartTime(Date.now());
		setSessionId(generateUUID());
		setRounds([]);
		setElapsedTime(0);
		startNewRound();
	}, [startNewRound]);

	// handle square click
	const handleSquareClick = useCallback(
		(position: [number, number], coords: [number, number]) => {
			if (!currentRound) return;

			const isCorrect =
				position[0] === currentRound.changedPosition[0] &&
				position[1] === currentRound.changedPosition[1];

			const roundData: RoundData = {
				level: currentRound.level,
				base_color: currentRound.baseColor,
				changed_color: currentRound.changedColor,
				color_model: currentRound.colorModel,
				changed_position: currentRound.changedPosition,
				click_position: position,
				click_coords: coords,
				time: (Date.now() - currentRound.startTime) / 1000,
				correct: isCorrect,
			};

			setRounds((prev) => [...prev, roundData]);

			if (isCorrect) {
				setScore((prev) => prev + 1);
				setLevel((prev) => prev + 1);
				startNewRound();
			} else {
				setWrongAnswers((prev) => prev + 1);
				if (wrongAnswers + 1 >= MAX_WRONG_ANSWERS) {
					endGame();
				} else {
					startNewRound();
				}
			}
		},
		[currentRound, wrongAnswers, startNewRound, endGame],
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
