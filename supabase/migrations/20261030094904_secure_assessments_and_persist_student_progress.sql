-- Expand assessment support to every Qimma education stage.
alter table public.student_challenge_attempts
  drop constraint if exists student_challenge_attempts_stage_check,
  drop constraint if exists student_challenge_attempts_grade_check;
alter table public.student_challenge_attempts
  add constraint student_challenge_attempts_stage_check
    check (stage = any (array['primary','prep','secondary','university']::text[])),
  add constraint student_challenge_attempts_grade_check
    check (grade = any (array[
      'primary1','primary2','primary3','primary4','primary5','primary6',
      'prep1','prep2','prep3','secondary1','secondary2','secondary3','university'
    ]::text[]));

-- Scores are written only by the trusted assessment Edge Function.
drop policy if exists "Insert own challenge attempts" on public.student_challenge_attempts;
revoke insert, update, delete on public.student_challenge_attempts from anon, authenticated;
grant select on public.student_challenge_attempts to authenticated;

create table if not exists public.student_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.student_progress enable row level security;
drop policy if exists "Students read own progress" on public.student_progress;
create policy "Students read own progress"
  on public.student_progress for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Service role manages student progress" on public.student_progress;
create policy "Service role manages student progress"
  on public.student_progress for all to service_role
  using (true) with check (true);
revoke insert, update, delete on public.student_progress from anon, authenticated;
grant select on public.student_progress to authenticated;
grant all on public.student_progress to service_role;
