-- ==========================================
-- MIGRACIÓN: Bucket de avatares y políticas
-- ==========================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public_read_avatars" on storage.objects;
create policy "public_read_avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own_or_admin" on storage.objects;
create policy "avatars_insert_own_or_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
          and role in ('admin', 'superadmin')
      )
    )
  );

drop policy if exists "avatars_update_own_or_admin" on storage.objects;
create policy "avatars_update_own_or_admin"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
          and role in ('admin', 'superadmin')
      )
    )
  );

drop policy if exists "avatars_delete_own_or_admin" on storage.objects;
create policy "avatars_delete_own_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
          and role in ('admin', 'superadmin')
      )
    )
  );
