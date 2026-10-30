create index if not exists student_challenge_attempts_user_created_at_idx
  on public.student_challenge_attempts (user_id, created_at desc);

create or replace function public.record_qimma_assessment(
  p_user_id uuid,
  p_stage text,
  p_grade text,
  p_subject text,
  p_score integer,
  p_correct_count integer,
  p_question_count integer,
  p_points integer
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_progress public.student_progress%rowtype;
  v_attempt_id uuid;
  v_daily_count integer;
begin
  if p_score <> p_correct_count * 10
     or p_correct_count < 0 or p_correct_count > 5
     or p_question_count <> 5
     or p_points < 0 or p_points > 150
     or p_subject not in ('math','science','arabic','english') then
    raise exception 'Invalid assessment result';
  end if;

  select count(*) into v_daily_count
  from public.student_challenge_attempts
  where user_id = p_user_id
    and created_at >= date_trunc('day', now());

  if v_daily_count >= 20 then
    raise exception 'Daily assessment limit reached';
  end if;

  insert into public.student_challenge_attempts
    (user_id, stage, grade, subject, score, correct_count, question_count)
  values
    (p_user_id, p_stage, p_grade, p_subject, p_score, p_correct_count, p_question_count)
  returning id into v_attempt_id;

  insert into public.student_progress (user_id, points, completed_count, updated_at)
  values (p_user_id, p_points, 1, now())
  on conflict (user_id) do update
    set points = public.student_progress.points + excluded.points,
        completed_count = public.student_progress.completed_count + 1,
        updated_at = now()
  returning * into v_progress;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'points', v_progress.points,
    'completed_count', v_progress.completed_count
  );
end;
$$;
