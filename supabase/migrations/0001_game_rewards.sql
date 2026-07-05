-- ============================================================
-- AXOR Oyun / Ã–dÃ¼l Sistemi - Supabase ÅemasÄ±
-- RLS kapalÄ± birakildi (trades tablosuyla tutarlÄ± - anon key kullanÄ±lÄ±yor)
-- ============================================================

create table if not exists games (
  id text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into games (id, name) values ('axor_runner', 'Axor Runner')
on conflict (id) do nothing;

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token uuid not null unique default gen_random_uuid(),
  wallet text not null,
  game_id text not null references games(id),

  server_seed text not null,
  speed_multiplier numeric not null default 1.0,

  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms bigint,

  score bigint,

  status text not null default 'pending'
    check (status in ('pending', 'verified', 'flagged', 'rejected')),
  reject_reason text,

  created_at timestamptz not null default now()
);

create index if not exists idx_game_sessions_wallet on game_sessions(wallet);
create index if not exists idx_game_sessions_status on game_sessions(status);
create index if not exists idx_game_sessions_token on game_sessions(session_token);

create table if not exists daily_leaderboard (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  wallet text not null,
  game_id text not null references games(id),
  best_score bigint not null,
  session_id uuid references game_sessions(id),

  reward_amount numeric,
  tx_signature text,
  paid_at timestamptz,

  created_at timestamptz not null default now(),
  unique (day, wallet, game_id)
);

create index if not exists idx_daily_leaderboard_day on daily_leaderboard(day, game_id);

create table if not exists reward_pools (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  game_id text not null references games(id),
  total_amount numeric not null default 0,
  is_distributed boolean not null default false,
  distributed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (day, game_id)
);

create table if not exists flagged_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id),
  reason text not null,
  admin_decision text
    check (admin_decision in ('approved', 'rejected')),
  decided_at timestamptz,
  decided_by text,
  created_at timestamptz not null default now()
);

create table if not exists submit_rate_log (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_submit_rate_log_wallet_time on submit_rate_log(wallet, submitted_at);
