alter table public.profiles
  add column if not exists status text not null default 'active',
  add column if not exists terminated_at timestamptz;

update public.profiles
set status = 'active'
where status is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_check
      check (status in ('active', 'inactive', 'terminated'));
  end if;
end $$;

create index if not exists profiles_status_idx on public.profiles (status);
