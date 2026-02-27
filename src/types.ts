export interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  ff_id: string;
  role: string;
}

export interface Tournament {
  id: number;
  title: string;
  entry_fee: number;
  prize_pool: number;
  start_time: string;
  map: string;
  mode: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  max_players: number;
  current_players: number;
  description: string;
  rules: string;
  image_url: string;
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

export interface LeaderboardEntry {
  username: string;
  total_kills: number;
  total_earnings: number;
}

export interface Team {
  id: number;
  name: string;
  tag: string;
  leader_id: number;
  logo_url: string;
}
