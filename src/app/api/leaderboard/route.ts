import { NextResponse } from 'next/server';
import { supabase } from '@/lib/database/supabase';

// configure edge runtime
export const runtime = 'edge';

// define types for our data
type ColorModel = 'RGB' | 'CIELAB' | 'CIECAM02-UCS' | 'Oklab';

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

export async function GET() {
  try {
    // fetch all sessions
    const { data: sessions, error } = await supabase
      .from('data')
      .select('*')
      .order('saved_at', { ascending: false });

    if (error) throw error;

    // analyze color model performance
    const colorModelStats: Record<ColorModel, { total: number; correct: number; avgTime: number; totalTime: number }> = {
      RGB: { total: 0, correct: 0, avgTime: 0, totalTime: 0 },
      CIELAB: { total: 0, correct: 0, avgTime: 0, totalTime: 0 },
      'CIECAM02-UCS': { total: 0, correct: 0, avgTime: 0, totalTime: 0 },
      Oklab: { total: 0, correct: 0, avgTime: 0, totalTime: 0 }
    };

    // analyze base colors performance
    const baseColorStats = new Map<string, { total: number; correct: number; avgTime: number; totalTime: number }>();

    // analyze user performance
    const userStats = new Map<string, {
      totalTests: number;
      correctTests: number;
      totalTime: number;
      bestLevel: number;
      sessions: Session[];
      deviceType: string;
    }>();

    // process all rounds from all sessions
    (sessions as Session[]).forEach(session => {
      // update user stats
      if (!userStats.has(session.player_id)) {
        userStats.set(session.player_id, {
          totalTests: 0,
          correctTests: 0,
          totalTime: 0,
          bestLevel: 0,
          sessions: [],
          deviceType: session.device_info.is_mobile ? 'Mobile' : 'Desktop'
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

        // update base color stats
        const baseColorKey = round.base_color.join(',');
        if (!baseColorStats.has(baseColorKey)) {
          baseColorStats.set(baseColorKey, { total: 0, correct: 0, avgTime: 0, totalTime: 0 });
        }
        const baseColor = baseColorStats.get(baseColorKey)!;
        baseColor.total++;
        baseColor.totalTime += round.time;
        if (round.correct) {
          baseColor.correct++;
        }

        // update user stats
        user.totalTests++;
        if (round.correct) {
          user.correctTests++;
        }
      });
    });

    // calculate averages and convert to array format
    const colorModelData = Object.entries(colorModelStats).map(([model, stats]) => ({
      model,
      totalTests: stats.total,
      accuracy: (stats.correct / stats.total) * 100,
      avgTime: stats.totalTime / stats.total
    }));

    // convert base color stats to array and calculate averages
    const baseColorData = Array.from(baseColorStats.entries()).map(([color, stats]) => ({
      color: color.split(',').map(Number),
      totalTests: stats.total,
      accuracy: (stats.correct / stats.total) * 100,
      avgTime: stats.totalTime / stats.total
    }));

    // convert user stats to array
    const userData = Array.from(userStats.entries()).map(([player_id, stats]) => ({
      player_id,
      totalTests: stats.totalTests,
      accuracy: (stats.correctTests / stats.totalTests) * 100,
      avgTime: stats.totalTime / stats.totalTests,
      bestLevel: stats.bestLevel,
      totalPlayTime: stats.totalTime,
      deviceType: stats.deviceType,
      sessions: stats.sessions
    }));

    // sort by best level (descending) first, then by accuracy (descending)
    const sortedUserData = userData
      .sort((a, b) => {
        if (b.bestLevel !== a.bestLevel) {
          return b.bestLevel - a.bestLevel;
        }
        return b.accuracy - a.accuracy;
      })
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    // calculate general stats
    const generalStats = {
      totalGames: sessions.length,
      totalPlayTime: sessions.reduce((sum, session) => sum + session.total_time, 0),
      totalPlayers: userStats.size,
      averageAccuracy: userData.reduce((sum, user) => sum + user.accuracy, 0) / userData.length
    };

    return NextResponse.json({
      colorModels: colorModelData,
      baseColors: baseColorData.slice(0, 20), // return top 20 best performing colors
      users: sortedUserData,
      sessions: sessions.slice(0, 10), // return 10 most recent sessions
      generalStats
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
} 