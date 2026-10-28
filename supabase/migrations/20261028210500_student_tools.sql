-- Student learning profile, age-group study community, and tutor daily usage limit.
create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  age_group text not null check (age_group in ('6-8','9-11','12-14','15-17','18+')),
  created_at timestamptz not null default now()
);
alter table public.student_profiles enable row level security;
grant select, insert on public.student_profiles to authenticated;
grant update (display_name) on public.student_profiles to authenticated;
drop policy if exists "Students read own profile" on public.student_profiles;
create policy "Students read own profile" on public.student_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Students create own profile" on public.student_profiles;
create policy "Students create own profile" on public.student_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Students update own display name" on public.student_profiles;
create policy "Students update own display name" on public.student_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.student_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  age_group text not null check (age_group in ('6-8','9-11','12-14','15-17','18+')),
  display_name text not null check (char_length(display_name) between 1 and 40),
  body text not null check (char_length(body) between 3 and 1200),
  created_at timestamptz not null default now()
);
create index if not exists student_posts_group_created_idx on public.student_posts(age_group, created_at desc);
alter table public.student_posts enable row level security;
grant select, insert, delete on public.student_posts to authenticated;
drop policy if exists "Students read their age group posts" on public.student_posts;
create policy "Students read their age group posts" on public.student_posts for select to authenticated
using (exists(select 1 from public.student_profiles p where p.user_id=auth.uid() and p.age_group=student_posts.age_group));
drop policy if exists "Students post to their age group" on public.student_posts;
create policy "Students post to their age group" on public.student_posts for insert to authenticated
with check (author_id=auth.uid() and exists(select 1 from public.student_profiles p where p.user_id=auth.uid() and p.age_group=student_posts.age_group));
drop policy if exists "Students delete own posts" on public.student_posts;
create policy "Students delete own posts" on public.student_posts for delete to authenticated using (author_id=auth.uid());

create table if not exists public.tutor_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  requests integer not null default 0 check (requests >= 0),
  primary key (user_id, usage_date)
);
alter table public.tutor_usage enable row level security;
revoke all on public.tutor_usage from public, anon, authenticated;
grant all on public.tutor_usage to service_role;
create or replace function public.consume_tutor_request(p_user_id uuid, p_limit integer default 20)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare current_count integer;
begin
  if p_user_id is null or p_limit < 1 or p_limit > 100 then return false; end if;
  insert into public.tutor_usage(user_id, usage_date, requests)
  values (p_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date) do update
    set requests = public.tutor_usage.requests + 1
    where public.tutor_usage.requests < p_limit
  returning requests into current_count;
  if not found then return false; end if;
  return current_count <= p_limit;
end;
$$;
revoke all on function public.consume_tutor_request(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_tutor_request(uuid, integer) to service_role;
