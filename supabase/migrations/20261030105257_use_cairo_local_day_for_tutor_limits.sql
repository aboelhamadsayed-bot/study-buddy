create or replace function public.consume_tutor_request(p_user_id uuid, p_limit integer default 20)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  current_count integer;
begin
  if p_user_id is null or p_limit < 1 or p_limit > 100 then
    return false;
  end if;

  insert into public.tutor_usage(user_id, usage_date, requests)
  values (p_user_id, (now() at time zone 'Africa/Cairo')::date, 1)
  on conflict (user_id, usage_date) do update
    set requests = public.tutor_usage.requests + 1
    where public.tutor_usage.requests < p_limit
  returning requests into current_count;

  if not found then
    return false;
  end if;

  return current_count <= p_limit;
end;
$function$;
