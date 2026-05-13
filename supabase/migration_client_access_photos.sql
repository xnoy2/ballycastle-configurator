-- Allow clients to upload access photos to their own order's access/ folder
create policy "Clients can upload access photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'order-photos'
    and get_my_role() = 'client'
    and split_part(name, '/', 2) = 'access'
    and split_part(name, '/', 1) in (
      select id::text from orders where client_id = auth.uid()
    )
  );

-- Allow clients to delete their own access photos
create policy "Clients can delete their access photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'order-photos'
    and get_my_role() = 'client'
    and split_part(name, '/', 2) = 'access'
    and split_part(name, '/', 1) in (
      select id::text from orders where client_id = auth.uid()
    )
  );
