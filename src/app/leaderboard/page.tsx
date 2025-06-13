'use client';

import { useEffect, useState } from 'react';
import Background from '@/components/layout/Background';

// types for leaderboard data
interface ColorModelStats {
  model: string;
  totalTests: number;
  accuracy: number;
  avgTime: number;
}

interface BaseColorStats {
  color: number[];
  totalTests: number;
  accuracy: number;
  avgTime: number;
}

interface RoundData {
  level: number;
  base_color: number[];
  changed_color: number[];
  color_model: string;
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

interface SessionStats {
  session_id: string;
  player_id: string;
  saved_at: string;
  total_time: number;
  final_level: number;
  rounds: RoundData[];
  device_info: DeviceInfo;
}

interface UserStats {
  player_id: string;
  totalTests: number;
  accuracy: number;
  avgTime: number;
  rank: number;
  sessions: SessionStats[];
  bestLevel: number;
  totalPlayTime: number;
  deviceType: string;
}

interface LeaderboardData {
  colorModels: ColorModelStats[];
  baseColors: BaseColorStats[];
  users: UserStats[];
  sessions: SessionStats[];
  generalStats: {
    totalGames: number;
    totalPlayTime: number;
    totalPlayers: number;
    averageAccuracy: number;
  };
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Failed to fetch leaderboard data');
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  // helper function to convert RGB array to hex color
  const rgbToHex = (rgb: number[]) => {
    return '#' + rgb.map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

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

  return (
    <div className="min-h-screen bg-black/50 pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden">
      <Background />
      <div className="max-w-6xl w-full mx-auto space-y-8 relative">
        {/* General Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-white">{data?.generalStats?.totalGames || 0}</p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Total Play Time</h3>
            <p className="text-3xl font-bold text-white">{data?.generalStats?.totalPlayTime ? `${Math.round(data.generalStats.totalPlayTime / 60)}m` : '0m'}</p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Total Players</h3>
            <p className="text-3xl font-bold text-white">{data?.generalStats?.totalPlayers || 0}</p>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/30">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Average Accuracy</h3>
            <p className="text-3xl font-bold text-white">{data?.generalStats?.averageAccuracy ? `${data.generalStats.averageAccuracy.toFixed(1)}%` : '0%'}</p>
          </div>
        </div>

        {/* Color Models Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Color Model Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data?.colorModels.map((model, index) => (
                  <tr key={model.model} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{model.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{model.totalTests}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{model.accuracy?.toFixed(1) ?? '0'}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{model.avgTime?.toFixed(2) ?? '0'}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Base Colors Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Top Performing Colors</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">RGB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data?.baseColors.map((color, index) => (
                  <tr key={index} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="w-8 h-8 rounded-full border border-gray-600"
                        style={{ backgroundColor: rgbToHex(color.color) }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {color.color.map(c => Math.round(c)).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{color.totalTests}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{color.accuracy?.toFixed(1) ?? '0'}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{color.avgTime?.toFixed(2) ?? '0'}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Top Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Best Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data?.users?.length ? (
                  data.users.map((user) => (
                    <tr key={user.player_id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">{user.rank}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.player_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.bestLevel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.totalPlayTime?.toFixed(1) ?? '0'}s</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.deviceType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.accuracy?.toFixed(1) ?? '0'}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-400">
                      No user data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sessions Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-700/30">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Recent Sessions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data?.sessions?.length ? (
                  data.sessions.slice(0, 10).map((session) => (
                    <tr key={session.session_id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{session.player_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(session.saved_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{session.final_level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{session.total_time?.toFixed(1) ?? '0'}s</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {session.device_info.is_mobile ? 'Mobile' : 'Desktop'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-400">
                      No session data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 