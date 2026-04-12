-- ==========================================
-- MIGRACIÓN: Bucket de imágenes de productos
-- ==========================================

insert into storage.buckets (id, name, public)
values ('products_images', 'products_images', true)
on conflict (id) do nothing;

-- Políticas: lectura pública y escritura autenticada
drop policy if exists "public_read_products_images" on storage.objects;
create policy "public_read_products_images"
  on storage.objects for select
  using (bucket_id = 'products_images');

drop policy if exists "auth_insert_products_images" on storage.objects;
create policy "auth_insert_products_images"
  on storage.objects for insert
  with check (bucket_id = 'products_images' and auth.role() = 'authenticated');

drop policy if exists "auth_update_products_images" on storage.objects;
create policy "auth_update_products_images"
  on storage.objects for update
  using (bucket_id = 'products_images' and auth.role() = 'authenticated');

drop policy if exists "auth_delete_products_images" on storage.objects;
create policy "auth_delete_products_images"
  on storage.objects for delete
  using (bucket_id = 'products_images' and auth.role() = 'authenticated');
