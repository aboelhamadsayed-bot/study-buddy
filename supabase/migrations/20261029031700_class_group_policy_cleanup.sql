-- Replace legacy age-only policies still present on the linked Supabase project.
drop policy if exists "Students can read posts in their age group" on public.student_posts;
drop policy if exists "Students can post only in their age group" on public.student_posts;
drop policy if exists "Students can update own display name" on public.student_profiles;

drop policy if exists "Students update own profile" on public.student_profiles;
create policy "Students update own profile" on public.student_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists student_posts_author_id_idx on public.student_posts(author_id);

