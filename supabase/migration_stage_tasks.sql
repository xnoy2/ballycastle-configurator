-- =====================================================================
-- BCF STAGE TASKS — sub-tasks within each build stage
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

create table if not exists stage_tasks (
  id         uuid        primary key default gen_random_uuid(),
  stage_id   uuid        not null references build_stages(id) on delete cascade,
  label      text        not null,
  completed  boolean     not null default false,
  created_at timestamptz default now()
);

alter table stage_tasks enable row level security;

create policy "Admin can manage stage tasks"
  on stage_tasks for all
  using (get_my_role() = 'admin');

create policy "Worker can manage stage tasks"
  on stage_tasks for all
  using (get_my_role() = 'worker');
