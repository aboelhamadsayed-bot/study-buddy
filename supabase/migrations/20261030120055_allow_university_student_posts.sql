-- Keep community post grade validation aligned with supported student profiles.
alter table public.student_posts
  drop constraint if exists student_posts_school_grade_check;

alter table public.student_posts
  add constraint student_posts_school_grade_check
  check (
    school_grade is null or school_grade = any (array[
      'primary1','primary2','primary3','primary4','primary5','primary6',
      'prep1','prep2','prep3','secondary1','secondary2','secondary3','university'
    ]::text[])
  );
