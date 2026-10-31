create table if not exists public.qimma_generated_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade text not null check (grade = any (array['primary1','primary2','primary3','primary4','primary5','primary6','prep1','prep2','prep3','secondary1','secondary2','secondary3','university']::text[])),
  subject text not null check (subject = any (array['math','science','arabic','english']::text[])),
  lesson text not null check (char_length(lesson) between 1 and 160),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  question_count integer not null check (question_count between 5 and 20),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 5 and 20),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  score integer,
  correct_count integer,
  points_awarded integer
);
alter table public.qimma_generated_exams enable row level security;
revoke all on public.qimma_generated_exams from public, anon, authenticated;
grant all on public.qimma_generated_exams to service_role;

create or replace function public.submit_qimma_generated_exam(
  p_exam_id uuid,
  p_user_id uuid,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_exam public.qimma_generated_exams%rowtype;
  v_question jsonb;
  v_answer jsonb;
  v_choice integer;
  v_correct integer := 0;
  v_points integer;
  v_stage text;
  v_saved jsonb;
  v_review jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Invalid answers';
  end if;
  select * into v_exam from public.qimma_generated_exams
    where id = p_exam_id and user_id = p_user_id for update;
  if not found or v_exam.submitted_at is not null then
    raise exception 'Exam unavailable or already submitted';
  end if;
  if jsonb_array_length(p_answers) <> v_exam.question_count then
    raise exception 'Incomplete answers';
  end if;

  for v_question in select value from jsonb_array_elements(v_exam.questions)
  loop
    select value into v_answer from jsonb_array_elements(p_answers)
      where value->>'id' = v_question->>'id';
    if v_answer is null then raise exception 'Missing answer'; end if;
    v_choice := (v_answer->>'choice')::integer;
    if v_choice < 0 or v_choice > 3 then raise exception 'Invalid choice'; end if;
    if v_choice = (v_question->>'answer')::integer then v_correct := v_correct + 1; end if;
    v_review := v_review || jsonb_build_array(jsonb_build_object(
      'id', v_question->>'id',
      'correct_choice', (v_question->>'answer')::integer,
      'explanation', v_question->>'explanation'
    ));
    v_answer := null;
  end loop;

  v_points := v_correct * 10;
  v_stage := case when v_exam.grade like 'primary%' then 'primary'
                  when v_exam.grade like 'prep%' then 'prep'
                  when v_exam.grade like 'secondary%' then 'secondary'
                  else 'university' end;
  v_saved := public.record_qimma_assessment(
    p_user_id, v_stage, v_exam.grade, v_exam.subject,
    v_correct * 10, v_correct, v_exam.question_count, v_points
  );
  update public.qimma_generated_exams
    set submitted_at = now(), score = v_correct * 10,
        correct_count = v_correct, points_awarded = v_points
    where id = v_exam.id;
  return jsonb_build_object(
    'score', round(v_correct * 100.0 / v_exam.question_count),
    'correct_count', v_correct,
    'question_count', v_exam.question_count,
    'points_awarded', v_points,
    'total_points', (v_saved->>'points')::integer,
    'completed_count', (v_saved->>'completed_count')::integer,
    'review', v_review
  );
end;
$$;
revoke all on function public.submit_qimma_generated_exam(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.submit_qimma_generated_exam(uuid,uuid,jsonb) to service_role;
