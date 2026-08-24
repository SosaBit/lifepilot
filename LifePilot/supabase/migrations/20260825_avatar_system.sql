alter table public.profiles add column if not exists avatar_key text not null default 'nova';
update public.profiles set avatar_key='nova' where avatar_key is null or avatar_key not in ('nova','fox','wolf','dragon','bot','mage','ninja','knight');
alter table public.profiles drop constraint if exists profiles_avatar_key_check;
alter table public.profiles add constraint profiles_avatar_key_check check (avatar_key in ('nova','fox','wolf','dragon','bot','mage','ninja','knight'));
alter table public.profiles alter column avatar_key set default 'nova';
