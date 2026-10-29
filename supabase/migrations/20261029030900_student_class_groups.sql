-- Add class and secondary-system data for onboarding and class-scoped study groups.
alter table public.student_profiles
  add column if not exists school_grade text,
  add column if not exists school_system text,
  add column if not exists school_track text;

alter table public.student_profiles
  drop constraint if exists student_profiles_school_grade_check,
  add constraint student_profiles_school_grade_check check (
    school_grade is null or school_grade in (
      'primary1','primary2','primary3','primary4','primary5','primary6',
      'prep1','prep2','prep3','secondary1','secondary2','secondary3'
    )
  ),
  drop constraint if exists student_profiles_school_system_check,
  add constraint student_profiles_school_system_check check (
    (school_grade is null and school_system is null and school_track is null)
    or (school_grade = 'secondary2' and school_system = 'general' and school_track is null)
    or (school_grade = 'secondary2' and school_system = 'bac' and school_track is not null and school_track in ('medicine','engineering','business','arts'))
    or (school_grade is not null and school_grade <> 'secondary2' and school_system is null and school_track is null)
  );

alter table public.student_posts
  add column if not exists school_grade text,
  add column if not exists school_system text,
  add column if not exists school_track text;

alter table public.student_posts
  drop constraint if exists student_posts_school_grade_check,
  add constraint student_posts_school_grade_check check (
    school_grade is null or school_grade in (
      'primary1','primary2','primary3','primary4','primary5','primary6',
      'prep1','prep2','prep3','secondary1','secondary2','secondary3'
    )
  ),
  drop constraint if exists student_posts_school_system_check,
  add constraint student_posts_school_system_check check (
    (school_grade is null and school_system is null and school_track is null)
    or (school_grade = 'secondary2' and school_system = 'general' and school_track is null)
    or (school_grade = 'secondary2' and school_system = 'bac' and school_track is not null and school_track in ('medicine','engineering','business','arts'))
    or (school_grade is not null and school_grade <> 'secondary2' and school_system is null and school_track is null)
  );

grant update (display_name, school_grade, school_system, school_track) on public.student_profiles to authenticated;
drop policy if exists "Students update own display name" on public.student_profiles;
drop policy if exists "Students can update own display name" on public.student_profiles;
create policy "Students update own profile" on public.student_profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop index if exists public.student_posts_group_created_idx;
create index if not exists student_posts_class_group_created_idx
  on public.student_posts(age_group, school_grade, school_system, school_track, created_at desc);

drop policy if exists "Students read their age group posts" on public.student_posts;
drop policy if exists "Students can read posts in their age group" on public.student_posts;
create policy "Students read their class group posts" on public.student_posts for select to authenticated
using (exists (
  select 1 from public.student_profiles p
  where p.user_id = (select auth.uid())
    and p.age_group = student_posts.age_group
    and (
      (student_posts.school_grade is null and student_posts.school_system is null and student_posts.school_track is null)
      or (p.school_grade = student_posts.school_grade
        and p.school_system is not distinct from student_posts.school_system
        and p.school_track is not distinct from student_posts.school_track)
    )
));

drop policy if exists "Students post to their age group" on public.student_posts;
drop policy if exists "Students can post only in their age group" on public.student_posts;
create policy "Students post to their class group" on public.student_posts for insert to authenticated
with check (author_id = (select auth.uid()) and school_grade is not null and exists (
  select 1 from public.student_profiles p
  where p.user_id = (select auth.uid())
    and p.age_group = student_posts.age_group
    and p.school_grade = student_posts.school_grade
    and p.school_system is not distinct from student_posts.school_system
    and p.school_track is not distinct from student_posts.school_track
));

