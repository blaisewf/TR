"use client";

import { motion, type Variants } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import Background from "@/components/layout/Background";
import { getPlayerId } from "@/lib/utils/playerId";
import type { LeaderboardData } from "../../types/leaderboard";
import FailurePlots from "@/components/leaderboard/FailurePlots";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const rowVariants: Variants = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.3,
		},
	},
};

const tableVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			duration: 0.3,
			ease: [0.4, 0, 0.2, 1],
		},
	},
};

export default function LeaderboardPage() {
	const { t } = useTranslation();
	const [data, setData] = useState<LeaderboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"global" | "profile">("global");
	const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		setCurrentPlayerId(getPlayerId());
	}, []);

	const fetchLeaderboardData = useCallback(async () => {
		try {
			const url = new URL("/api/leaderboard", window.location.origin);
			url.searchParams.set("view", viewMode);
			if (viewMode === "profile" && currentPlayerId) {
				url.searchParams.set("player", currentPlayerId);
			}
			if (searchQuery) {
				url.searchParams.set("search", searchQuery);
			}

			const response = await fetch(url);
			if (!response.ok) throw new Error("Failed to fetch leaderboard data");
			const data = await response.json();
			setData(data);
		} catch (error) {
			console.error("Error fetching leaderboard data:", error);
			setError(t("leaderboard.error"));
		} finally {
			setLoading(false);
		}
	}, [viewMode, currentPlayerId, searchQuery, t]);

	useEffect(() => {
		fetchLeaderboardData();
	}, [fetchLeaderboardData]);

	if (loading) {
		return (
			<div className="min-h-screen bg-black/50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
				<Background />
				<div className="flex items-center justify-center">
					<div className="w-8 h-8 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-black/50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
				<Background />
				<div className="text-center text-red-400">{error}</div>
			</div>
		);
	}

	if (viewMode === "profile" && !currentPlayerId) {
		return (
			<div className="min-h-screen bg-black/50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
				<Background />
				<div className="text-center text-red-400">
					{t("leaderboard.error")}
					<p className="mt-2 text-sm text-gray-400">
						{t("leaderboard.profile.noPlayerId")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-black/50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
			<Background />
			<div className="max-w-6xl w-full mx-auto space-y-4 relative">
				{/* View Mode Toggle */}
				<div className="flex justify-end mb-4">
					<div className="bg-gray-800/20 backdrop-blur-md border border-gray-700/20 rounded-full p-2 shadow-lg">
						<div className="flex items-center space-x-2">
							<button
								onClick={() => setViewMode("global")}
								className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
									viewMode === "global"
										? "text-white bg-gray-700/50"
										: "text-gray-300 hover:text-white hover:bg-gray-700/30"
								}`}
							>
								{t("leaderboard.viewMode.global")}
							</button>
							<button
								onClick={() => setViewMode("profile")}
								className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
									viewMode === "profile"
										? "text-white bg-gray-700/50"
										: "text-gray-300 hover:text-white hover:bg-gray-700/30"
								}`}
							>
								{t("leaderboard.viewMode.profile")}
							</button>
						</div>
					</div>
				</div>

				{/* No Data Card */}
				{viewMode === "profile" &&
					(!data?.users?.length || !data?.sessions?.length) && (
						<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
							<h2 className="text-2xl font-bold mb-2 text-center text-white">
								{t("leaderboard.profile.noData.title")}
							</h2>
							<p className="text-sm text-gray-400 text-center mb-4">
								{t("leaderboard.profile.noData.message")}
							</p>
							<p className="text-xs text-gray-500 text-center mb-6">
								{t("leaderboard.profile.noData.info")}
							</p>
							<div className="text-center">
								<a
									href="/"
									className="w-full sm:w-auto bg-gray-800/20 backdrop-blur-md border border-gray-700/20 text-white hover:bg-gray-700/30 font-medium py-3 px-6 sm:px-8 rounded-full text-sm shadow-lg transition-all duration-300 cursor-pointer"
								>
									{t("leaderboard.profile.noData.playNow")}
								</a>
							</div>
						</div>
					)}

				{/* General Stats Section */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
						<h3 className="text-lg font-semibold text-gray-400 mb-2">
							{t("leaderboard.stats.totalGames")}
						</h3>
						<p className="text-3xl font-bold text-white">
							{data?.generalStats?.totalGames || 0}
						</p>
					</div>
					<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
						<h3 className="text-lg font-semibold text-gray-400 mb-2">
							{t("leaderboard.stats.totalPlayTime")}
						</h3>
						<p className="text-3xl font-bold text-white">
							{data?.generalStats?.totalPlayTime
								? `${Math.floor(data.generalStats.totalPlayTime / 60)}m ${Math.round(data.generalStats.totalPlayTime % 60)}s`
								: "0m 0s"}
						</p>
					</div>
					<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
						<h3 className="text-lg font-semibold text-gray-400 mb-2">
							{t("leaderboard.stats.totalPlayers")}
						</h3>
						<p className="text-3xl font-bold text-white">
							{data?.generalStats?.totalPlayers || 0}
						</p>
					</div>
					<div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
						<h3 className="text-lg font-semibold text-gray-400 mb-2">
							{t("leaderboard.stats.averageAccuracy")}
						</h3>
						<p className="text-3xl font-bold text-white">
							{data?.generalStats?.averageAccuracy
								? `${data.generalStats.averageAccuracy.toFixed(1)}%`
								: "0%"}
						</p>
					</div>
				</div>

				{/* Color Models Section */}
				<motion.div
					className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30"
					variants={tableVariants}
					initial="hidden"
					animate="visible"
				>
					<h2 className="text-2xl font-bold mb-2 text-center text-white">
						{t("leaderboard.colorModels.title")}
					</h2>
					<p className="text-sm text-gray-400 text-center mb-6">
						{t("leaderboard.colorModels.description")}
					</p>

					{/* Bar Chart for Color Models */}
					<div className="h-80 mb-8">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data?.colorModels}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(75, 85, 99, 0.3)"
								/>
								<XAxis
									dataKey="model"
									stroke="#9CA3AF"
									tick={{ fill: "#9CA3AF", fontSize: 12 }}
									axisLine={{ stroke: "rgba(75, 85, 99, 0.3)" }}
								/>
								<YAxis
									stroke="#9CA3AF"
									tick={{ fill: "#9CA3AF", fontSize: 12 }}
									axisLine={{ stroke: "rgba(75, 85, 99, 0.3)" }}
									tickFormatter={(value) => Number(value).toFixed(3)}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(31, 41, 55, 0.95)",
										border: "1px solid rgba(75, 85, 99, 0.3)",
										borderRadius: "0.5rem",
										color: "#fff",
										boxShadow:
											"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
									}}
									labelStyle={{ color: "#9CA3AF", fontSize: 12 }}
									itemStyle={{ color: "#fff", fontSize: 12 }}
									formatter={(value: number, name: string) => [
										`${name} ${Number(value).toFixed(3)}`,
										"",
									]}
									cursor={false}
								/>
								<Legend
									wrapperStyle={{
										color: "#9CA3AF",
										fontSize: 12,
										paddingTop: "1rem",
									}}
								/>
								<Bar
									dataKey="accuracy"
									name="Accuracy %"
									fill="#60A5FA"
									radius={[4, 4, 0, 0]}
									activeBar={false}
								/>
								<Bar
									dataKey="avgTime"
									name="Avg Time (s)"
									fill="#34D399"
									radius={[4, 4, 0, 0]}
									activeBar={false}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Original Table */}
					<div className="overflow-x-auto">
						<motion.table
							className="min-w-full divide-y divide-gray-700"
							variants={containerVariants}
							initial="hidden"
							animate="visible"
							style={{ overflow: "hidden" }}
						>
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										#
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorModels.table.model")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorModels.table.tests")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorModels.table.accuracy")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorModels.table.avgTime")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-700">
								{data?.colorModels
									.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))
									.map((model, index) => (
										<motion.tr
											key={model.model}
											className="hover:bg-gray-700/30 transition-colors"
											variants={rowVariants}
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
												{index + 1}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
												{model.model}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{model.totalTests}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{model.accuracy?.toFixed(3) ?? "0"}%
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{model.avgTime?.toFixed(3) ?? "0"}s
											</td>
										</motion.tr>
									))}
							</tbody>
						</motion.table>
					</div>
				</motion.div>

				{/* Color Families Section */}
				<motion.div
					className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30"
					variants={tableVariants}
					initial="hidden"
					animate="visible"
				>
					<h2 className="text-2xl font-bold mb-2 text-center text-white">
						{t("leaderboard.colorFamilies.title")}
					</h2>
					<p className="text-sm text-gray-400 text-center mb-6">
						{t("leaderboard.colorFamilies.description")}
					</p>

					{/* Pie Chart for Color Families */}
					<div className="h-80 mb-8">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={data?.colorFamilies}
									dataKey="accuracy"
									nameKey="name"
									cx="50%"
									cy="50%"
									outerRadius={100}
									label={({
										name,
										percent,
									}: {
										name: string;
										percent: number;
									}) => `${name} ${(percent * 100).toFixed(0)}%`}
									labelLine={{ stroke: "rgba(75, 85, 99, 0.3)" }}
								>
									{data?.colorFamilies?.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.hexColor}
											stroke="rgba(31, 41, 55, 0.95)"
											strokeWidth={2}
										/>
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(31, 41, 55, 0.95)",
										border: "1px solid rgba(75, 85, 99, 0.3)",
										borderRadius: "0.5rem",
										color: "#fff",
										boxShadow:
											"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
									}}
									labelStyle={{ color: "#9CA3AF", fontSize: 12 }}
									itemStyle={{ color: "#fff", fontSize: 12 }}
									formatter={(value: number, name: string) => [
										`${name} ${Number(value).toFixed(3)}`,
										"",
									]}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>

					{/* Original Table */}
					<div className="overflow-x-auto">
						<motion.table
							className="min-w-full divide-y divide-gray-700"
							variants={containerVariants}
							initial="hidden"
							animate="visible"
							style={{ overflow: "hidden" }}
						>
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										#
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorFamilies.table.family")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorFamilies.table.tests")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorFamilies.table.accuracy")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.colorFamilies.table.avgTime")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-700">
								{data?.colorFamilies?.map((family, index) => (
									<motion.tr
										key={family.name}
										className="hover:bg-gray-700/30 transition-colors"
										variants={rowVariants}
									>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
											{index + 1}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center gap-2">
												<div
													className="w-8 h-8 rounded-full border border-gray-600"
													style={{ backgroundColor: family.hexColor }}
												/>
												<span className="text-sm font-medium text-white">
													{family.name}
												</span>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
											{family.totalTests}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
											{family.accuracy?.toFixed(2) ?? "0"}%
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
											{family.avgTime?.toFixed(2) ?? "0"}s
										</td>
									</motion.tr>
								))}
							</tbody>
						</motion.table>
					</div>
				</motion.div>

				{/* Users Section */}
				<motion.div
					className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30"
					variants={tableVariants}
					initial="hidden"
					animate="visible"
				>
					<h2 className="text-2xl font-bold mb-2 text-center text-white">
						{t("leaderboard.users.title")}
					</h2>
					<p className="text-sm text-gray-400 text-center mb-6">
						{t("leaderboard.users.description")}
					</p>

					{/* Search Input */}
					<div className="mb-6">
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={t("leaderboard.users.searchPlaceholder")}
								className="w-full bg-gray-800/50 border border-gray-700/30 rounded-lg py-2 px-4 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
							/>
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<svg
									className="h-5 w-5 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						<motion.table
							className="min-w-full divide-y divide-gray-700"
							variants={containerVariants}
							initial="hidden"
							animate="visible"
							style={{ overflow: "hidden" }}
						>
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										#
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.users.table.playerId")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.users.table.bestLevel")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.users.table.totalTime")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.users.table.games")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.users.table.device")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.users.table.accuracy")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-700">
								{data?.users?.length ? (
									(searchQuery
										? data.users.filter(
												(user) =>
													user.player_id
														.toLowerCase()
														.includes(searchQuery.toLowerCase()) ||
													user.deviceType
														.toLowerCase()
														.includes(searchQuery.toLowerCase()),
											)
										: data.users.slice(0, 10)
									).map((user) => (
										<motion.tr
											key={user.player_id}
											className="hover:bg-gray-700/30 transition-colors"
											variants={rowVariants}
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
												{user.rank}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
												{user.player_id.split("-")[0]}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{user.bestLevel}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{user.totalPlayTime
													? `${Math.floor(user.totalPlayTime / 60)}m ${Math.round(user.totalPlayTime % 60)}s`
													: "0m 0s"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{user.totalGames || 0}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{user.deviceType}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{user.accuracy?.toFixed(1) ?? "0"}%
											</td>
										</motion.tr>
									))
								) : (
									<motion.tr variants={rowVariants}>
										<td
											colSpan={7}
											className="px-6 py-4 text-center text-sm text-gray-400"
										>
											{t("leaderboard.users.noData")}
										</td>
									</motion.tr>
								)}
							</tbody>
						</motion.table>
					</div>
				</motion.div>

				{/* Recent Sessions Section */}
				<motion.div
					className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30"
					variants={tableVariants}
					initial="hidden"
					animate="visible"
				>
					<h2 className="text-2xl font-bold mb-2 text-center text-white">
						{t("leaderboard.sessions.title")}
					</h2>
					<p className="text-sm text-gray-400 text-center mb-6">
						{t("leaderboard.sessions.description")}
					</p>

					{/* Line Chart for Session Times */}
					<div className="h-80 mb-8">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data?.sessions?.slice(0, 10)}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(75, 85, 99, 0.3)"
								/>
								<XAxis
									dataKey="saved_at"
									stroke="#9CA3AF"
									tick={{ fill: "#9CA3AF", fontSize: 12 }}
									axisLine={{ stroke: "rgba(75, 85, 99, 0.3)" }}
									tickFormatter={(value: string) => {
										const date = new Date(value);
										return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
									}}
								/>
								<YAxis
									stroke="#9CA3AF"
									tick={{ fill: "#9CA3AF", fontSize: 12 }}
									axisLine={{ stroke: "rgba(75, 85, 99, 0.3)" }}
									tickFormatter={(value) => Number(value).toFixed(1)}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(31, 41, 55, 0.95)",
										border: "1px solid rgba(75, 85, 99, 0.3)",
										borderRadius: "0.5rem",
										color: "#fff",
										boxShadow:
											"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
									}}
									labelStyle={{ color: "#9CA3AF", fontSize: 12 }}
									itemStyle={{ color: "#fff", fontSize: 12 }}
									labelFormatter={(value: string) =>
										new Date(value).toLocaleString()
									}
									formatter={(value: number, name: string) => [
										`${name} ${Number(value).toFixed(1)}`,
										"",
									]}
								/>
								<Legend
									wrapperStyle={{
										color: "#9CA3AF",
										fontSize: 12,
										paddingTop: "1rem",
									}}
								/>
								<Line
									type="monotone"
									dataKey="total_time"
									name="Total Time (s)"
									stroke="#60A5FA"
									strokeWidth={2}
									dot={{
										fill: "#60A5FA",
										stroke: "rgba(31, 41, 55, 0.95)",
										strokeWidth: 2,
										r: 4,
									}}
									activeDot={{
										fill: "#60A5FA",
										stroke: "rgba(31, 41, 55, 0.95)",
										strokeWidth: 2,
										r: 6,
									}}
								/>
								<Line
									type="monotone"
									dataKey="final_level"
									name="Final Level"
									stroke="#34D399"
									strokeWidth={2}
									dot={{
										fill: "#34D399",
										stroke: "rgba(31, 41, 55, 0.95)",
										strokeWidth: 2,
										r: 4,
									}}
									activeDot={{
										fill: "#34D399",
										stroke: "rgba(31, 41, 55, 0.95)",
										strokeWidth: 2,
										r: 6,
									}}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Original Table */}
					<div className="overflow-x-auto">
						<motion.table
							className="min-w-full divide-y divide-gray-700"
							variants={containerVariants}
							initial="hidden"
							animate="visible"
							style={{ overflow: "hidden" }}
						>
							<thead>
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.sessions.table.playerId")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.sessions.table.date")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.sessions.table.level")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.sessions.table.time")}
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
										{t("leaderboard.sessions.table.device")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-700">
								{data?.sessions?.length ? (
									data.sessions.slice(0, 10).map((session) => (
										<motion.tr
											key={session.session_id}
											className="hover:bg-gray-700/30 transition-colors"
											variants={rowVariants}
										>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
												{session.player_id.split("-")[0]}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{new Date(session.saved_at).toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{session.final_level}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{session.total_time?.toFixed(1) ?? "0"}s
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
												{session.device_info.is_mobile
													? t("leaderboard.sessions.deviceTypes.mobile")
													: t("leaderboard.sessions.deviceTypes.desktop")}
											</td>
										</motion.tr>
									))
								) : (
									<motion.tr variants={rowVariants}>
										<td
											colSpan={5}
											className="px-6 py-4 text-center text-sm text-gray-400"
										>
											{t("leaderboard.sessions.noData")}
										</td>
									</motion.tr>
								)}
							</tbody>
						</motion.table>
					</div>
				</motion.div>

				{/* color model failure plots */}
				<motion.div
					className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30"
					variants={tableVariants}
					initial="hidden"
					animate="visible"
				>
					<h2 className="text-2xl font-bold mb-4 text-center text-white">{t("leaderboard.failurePlots.title")}</h2>
					<p className="text-sm text-gray-400 text-center mb-6">
						{t("leaderboard.failurePlots.description")}
					</p>
					<FailurePlots />
				</motion.div>
			</div>
		</div>
	);
}
