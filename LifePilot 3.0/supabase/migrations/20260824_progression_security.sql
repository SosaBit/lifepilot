revoke execute on function public.complete_life_session(uuid) from anon;
revoke execute on function public.record_quiz_result(text,uuid,uuid,integer,integer,text[]) from anon;
revoke execute on function public.evaluate_progression() from anon,authenticated;
revoke execute on function public.trigger_evaluate_progression() from anon,authenticated;
