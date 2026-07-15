alter table game_sessions add column if not exists heartbeat_count integer not null default 0;
alter table game_sessions add column if not exists last_heartbeat_at timestamptz;
