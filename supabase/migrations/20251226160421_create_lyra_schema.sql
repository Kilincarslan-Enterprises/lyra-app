/*
  # LYRA Social Media Command Center Schema

  ## Overview
  This migration creates the complete database schema for LYRA, an AI-powered social media management platform.

  ## New Tables
  
  ### 1. social_accounts
  Stores connected social media accounts for each user
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `platform` (text) - Platform name (TikTok, Instagram, YouTube, X)
  - `account_name` (text) - Display name of the account
  - `username` (text) - Username/handle
  - `created_at` (timestamptz) - When account was connected
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. chat_messages
  Stores chat conversation history between user and LYRA AI
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `message` (text) - User's message content
  - `response` (text) - AI assistant's response
  - `created_at` (timestamptz) - Message timestamp
  - `metadata` (jsonb) - Additional message metadata

  ### 3. posts
  Stores social media posts from Postiz integration
  - `id` (uuid, primary key) - Unique identifier
  - `account_id` (uuid, foreign key) - References social_accounts
  - `platform` (text) - Social media platform
  - `content` (text) - Post content/caption
  - `status` (text) - Status: posted, scheduled, failed
  - `scheduled_date` (timestamptz) - When post is scheduled
  - `posted_date` (timestamptz) - When post was actually posted
  - `external_id` (text) - ID from Postiz
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. analytics
  Stores analytics data from Airtable integration
  - `id` (uuid, primary key) - Unique identifier
  - `account_id` (uuid, foreign key) - References social_accounts
  - `views` (bigint) - Number of views
  - `likes` (bigint) - Number of likes
  - `comments` (bigint) - Number of comments
  - `engagement_rate` (decimal) - Engagement rate percentage
  - `date` (date) - Date of analytics data
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Separate policies for SELECT, INSERT, UPDATE, DELETE operations
*/

-- Create social_accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('TikTok', 'Instagram', 'YouTube', 'X')),
  account_name text NOT NULL,
  username text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  response text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('posted', 'scheduled', 'failed')),
  scheduled_date timestamptz,
  posted_date timestamptz,
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  engagement_rate decimal(5,2) DEFAULT 0.00,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_account_id ON posts(account_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_analytics_account_id ON analytics(account_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date DESC);

-- Enable Row Level Security
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_accounts
CREATE POLICY "Users can view own social accounts"
  ON social_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social accounts"
  ON social_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts"
  ON social_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts"
  ON social_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for posts
CREATE POLICY "Users can view posts from their accounts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = posts.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert posts for their accounts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = posts.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts from their accounts"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = posts.account_id
      AND social_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = posts.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete posts from their accounts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = posts.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for analytics
CREATE POLICY "Users can view analytics from their accounts"
  ON analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = analytics.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics for their accounts"
  ON analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = analytics.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analytics from their accounts"
  ON analytics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = analytics.account_id
      AND social_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = analytics.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete analytics from their accounts"
  ON analytics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_accounts
      WHERE social_accounts.id = analytics.account_id
      AND social_accounts.user_id = auth.uid()
    )
  );