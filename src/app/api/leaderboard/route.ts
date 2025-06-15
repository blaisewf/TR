import { supabase, getTableName } from "@/lib/database/supabase";
import { NextResponse } from "next/server";

// configure edge runtime
export const runtime = "edge";

// define types for our data
type ColorModel = "RGB" | "CIELAB" | "JzAzBz" | "Oklab";

interface Round {
	level: number;
	base_color: number[];
	changed_color: number[];
	color_model: ColorModel;
	changed_position: number[];
	click_position: number[];
	click_coords: number[];
	time: number;
	correct: boolean;
}

interface DeviceInfo {
	language: string;
	platform: string;
	is_mobile: boolean;
	user_agent: string;
	color_depth: number;
	pixel_ratio: number;
	screen_width: number;
	screen_height: number;
}

interface Session {
	session_id: string;
	player_id: string;
	saved_at: string;
	total_time: number;
	final_level: number;
	rounds: Round[];
	device_info: DeviceInfo;
}

export async function GET(request: Request) {
	try {
		// get the view parameter from the URL
		const { searchParams } = new URL(request.url);
		const view = searchParams.get("view") || "global";
		const playerId = searchParams.get("player");
		const searchQuery = searchParams.get("search")?.toLowerCase();

		// fetch all sessions
		const { data: sessions, error } = await supabase
			.from(getTableName())
			.select("*")
			.order("saved_at", { ascending: false });

		if (error) throw error;

		// if profile view, get the current player's data
		let filteredSessions = sessions;
		if (view === "profile" && playerId) {
			filteredSessions = sessions.filter(
				(session) => session.player_id === playerId,
			);
		}

		// analyze color model performance
		const colorModelStats: Record<
			ColorModel,
			{ total: number; correct: number; avgTime: number; totalTime: number }
		> = {
			RGB: { total: 0, correct: 0, avgTime: 0, totalTime: 0 },
			CIELAB: { total: 0, correct: 0, avgTime: 0, totalTime: 0 },
			JzAzBz: { total: 0, correct: 0, avgTime: 0, totalTime: 0 },
			Oklab: { total: 0, correct: 0, avgTime: 0, totalTime: 0 },
		};

		// analyze color families performance
		const colorFamilyStats = new Map<
			string,
			{
				total: number;
				correct: number;
				avgTime: number;
				totalTime: number;
				hexColor: string;
			}
		>();

		// analyze user performance
		const userStats = new Map<
			string,
			{
				totalTests: number;
				correctTests: number;
				totalTime: number;
				bestLevel: number;
				sessions: Session[];
				deviceType: string;
			}
		>();

		// process all rounds from filtered sessions
		(filteredSessions as Session[]).forEach((session) => {
			// update user stats
			if (!userStats.has(session.player_id)) {
				userStats.set(session.player_id, {
					totalTests: 0,
					correctTests: 0,
					totalTime: 0,
					bestLevel: 0,
					sessions: [],
					deviceType: session.device_info.is_mobile ? "Mobile" : "Desktop",
				});
			}
			const user = userStats.get(session.player_id)!;
			user.sessions.push(session);
			user.bestLevel = Math.max(user.bestLevel, session.final_level);
			user.totalTime += session.total_time;

			session.rounds.forEach((round: Round) => {
				// update color model stats
				const model = round.color_model;
				colorModelStats[model].total++;
				colorModelStats[model].totalTime += round.time;
				if (round.correct) {
					colorModelStats[model].correct++;
				}

				// update color family stats
				const [r, g, b] = round.base_color;
				let family = "Other";
				let hexColor = "#A0522D";

				// determine color family based on RGB values with more inclusive thresholds
				if (r > g && r > b && r > 120) {
					if (g > 100 && b < 100) {
						family = "Orange";
						hexColor = "#FFA500";
					} else if (b > 100 && g < 100) {
						family = "Magenta";
						hexColor = "#FF00FF";
					} else {
						family = "Red";
						hexColor = "#FF0000";
					}
				} else if (g > r && g > b && g > 120) {
					if (r > 100 && b < 100) {
						family = "Lime";
						hexColor = "#9ACD32";
					} else if (b > 100 && r < 100) {
						family = "Cyan";
						hexColor = "#00FFFF";
					} else {
						family = "Green";
						hexColor = "#00FF00";
					}
				} else if (b > r && b > g && b > 120) {
					if (r > 100 && g < 100) {
						family = "Purple";
						hexColor = "#800080";
					} else if (g > 100 && r < 100) {
						family = "Aqua";
						hexColor = "#008B8B";
					} else {
						family = "Blue";
						hexColor = "#0000FF";
					}
				} else if (r > 140 && g > 140 && b > 140) {
					family = "White";
					hexColor = "#FFFFFF";
				} else if (r < 60 && g < 60 && b < 60) {
					family = "Black";
					hexColor = "#000000";
				} else if (
					Math.abs(r - g) < 30 &&
					Math.abs(g - b) < 30 &&
					Math.abs(r - b) < 30
				) {
					family = "Gray";
					hexColor = "#808080";
				}

				if (!colorFamilyStats.has(family)) {
					colorFamilyStats.set(family, {
						total: 0,
						correct: 0,
						avgTime: 0,
						totalTime: 0,
						hexColor,
					});
				}
				const colorFamily = colorFamilyStats.get(family)!;
				colorFamily.total++;
				colorFamily.totalTime += round.time;
				if (round.correct) {
					colorFamily.correct++;
				}

				// update user stats
				user.totalTests++;
				if (round.correct) {
					user.correctTests++;
				}
			});
		});

		// calculate averages and convert to array format
		const colorModelData = Object.entries(colorModelStats)
			.filter(([_, stats]) => stats.total > 0)
			.map(([model, stats]) => ({
				model,
				totalTests: stats.total,
				accuracy: (stats.correct / stats.total) * 100,
				avgTime: stats.totalTime / stats.total,
			}));

		// convert color family stats to array and sort by accuracy
		const colorFamilyData = Array.from(colorFamilyStats.entries())
			.filter(([_, stats]) => stats.total > 0)
			.map(([name, stats]) => ({
				name,
				hexColor: stats.hexColor,
				totalTests: stats.total,
				accuracy: (stats.correct / stats.total) * 100,
				avgTime: stats.totalTime / stats.total,
			}))
			.sort((a, b) => b.accuracy - a.accuracy);

		// convert user stats to array
		const userData = Array.from(userStats.entries()).map(
			([player_id, stats]) => ({
				player_id,
				totalTests: stats.totalTests,
				accuracy: (stats.correctTests / stats.totalTests) * 100,
				avgTime: stats.totalTime / stats.totalTests,
				bestLevel: stats.bestLevel,
				totalPlayTime: stats.totalTime,
				deviceType: stats.deviceType,
				sessions: stats.sessions,
				totalGames: stats.sessions.length,
			}),
		);

		// filter users by search query if provided
		let filteredUserData = userData;
		if (searchQuery) {
			filteredUserData = userData.filter(
				(user) =>
					user.player_id.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
					user.deviceType.toLowerCase().startsWith(searchQuery.toLowerCase()),
			);
		}

		// sort by best level (descending) first, then by accuracy (descending)
		const sortedUserData = filteredUserData
			.sort((a, b) => {
				if (b.bestLevel !== a.bestLevel) {
					return b.bestLevel - a.bestLevel;
				}
				return b.accuracy - a.accuracy;
			})
			.map((user, index) => ({
				...user,
				rank: index + 1,
			}));

		// calculate general stats
		const generalStats = {
			totalGames: filteredSessions.length,
			totalPlayTime: filteredSessions.reduce(
				(sum, session) => sum + session.total_time,
				0,
			),
			totalPlayers: userStats.size,
			averageAccuracy:
				userData.reduce((sum, user) => sum + user.accuracy, 0) /
				userData.length,
		};

		return NextResponse.json({
			colorModels: colorModelData,
			colorFamilies: colorFamilyData,
			users: sortedUserData,
			sessions: filteredSessions.slice(0, 10),
			generalStats,
		});
	} catch (error) {
		console.error("Error fetching leaderboard data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch leaderboard data" },
			{ status: 500 },
		);
	}
}
