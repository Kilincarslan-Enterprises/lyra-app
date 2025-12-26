import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube' | 'X';
  account_name: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  response: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface Post {
  id: string;
  account_id: string;
  platform: string;
  content: string;
  status: 'posted' | 'scheduled' | 'failed';
  scheduled_date: string | null;
  posted_date: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  id: string;
  account_id: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  date: string;
  created_at: string;
  updated_at: string;
}
