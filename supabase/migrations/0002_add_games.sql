-- ============================================================
-- Flappy Bird ve Block Blast oyunlarini games tablosuna ekle
-- ============================================================

insert into games (id, name) values ('flappy_bird', 'Flappy Bird')
on conflict (id) do nothing;

insert into games (id, name) values ('block_blast', 'Block Blast')
on conflict (id) do nothing;
