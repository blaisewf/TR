// types for leaderboard data
export interface ColorModelStats {
  model: string;
  totalTests: number;
  accuracy: number;
  avgTime: number;
}

export interface ColorFamily {
  name: string;
  hexColor: string;
  totalTests: number;
  accuracy: number;
  avgTime: number;
}

export interface BaseColorStats {
  color: number[];
  totalTests: number;
  accuracy: number;
  avgTime: number;
}

export interface RoundData {
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

export interface DeviceInfo {
  language: string;
  platform: string;
  is_mobile: boolean;
  user_agent: string;
  color_depth: number;
  pixel_ratio: number;
  screen_width: number;
  screen_height: number;
}

export interface SessionStats {
  session_id: string;
  player_id: string;
  saved_at: string;
  total_time: number;
  final_level: number;
  rounds: RoundData[];
  device_info: DeviceInfo;
}

export interface UserStats {
  player_id: string;
  totalTests: number;
  accuracy: number;
  avgTime: number;
  rank: number;
  sessions: SessionStats[];
  bestLevel: number;
  totalPlayTime: number;
  deviceType: string;
  totalGames: number;
}

export interface LeaderboardData {
  colorModels: ColorModelStats[];
  colorFamilies: ColorFamily[];
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