-- game_sessions ve ilgili tablolarda RLS'i gercekten kapat
alter table games disable row level security;
alter table game_sessions disable row level security;
alter table daily_leaderboard disable row level security;
alter table reward_pools disable row level security;
alter table flagged_scores disable row level security;
alter table submit_rate_log disable row level security;
