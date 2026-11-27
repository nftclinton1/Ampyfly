CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT '',
  xp INTEGER DEFAULT 0,
  earned_usd NUMERIC(10, 2) DEFAULT 0,
  trust_tier INTEGER DEFAULT 1,
  wallets JSONB DEFAULT '{"baseUsdc":"","solana":"","fiatRail":""}'::jsonb,
  socials JSONB DEFAULT '{"x":"","telegram":"","discord":"","whatsapp":""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  sector TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('LIVE', 'ENDED', 'UPCOMING')),
  prize_usd NUMERIC(10, 2) DEFAULT 0,
  prize_xp INTEGER DEFAULT 0,
  participants INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  duration TEXT NOT NULL,
  nda_protected BOOLEAN DEFAULT FALSE,
  accent TEXT DEFAULT '#38BDF8',
  summary TEXT NOT NULL,
  highlights JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id TEXT REFERENCES quests(id) ON DELETE CASCADE,
  user_handle TEXT NOT NULL,
  proof_url TEXT NOT NULL,
  proof_note TEXT DEFAULT '',
  completed_task_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alpha_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  sector TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  sector TEXT NOT NULL,
  package_type TEXT NOT NULL,
  budget TEXT NOT NULL,
  timeline TEXT NOT NULL,
  goal TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
