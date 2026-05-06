-- =====================================================================
-- BCF ORDER DOCUMENTS
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ALSO: Create a storage bucket named 'order-documents' (private)
--   Dashboard → Storage → New bucket → name: order-documents → Private
-- =====================================================================

create table if not exists order_documents (
  id              uuid          primary key default gen_random_uuid(),
  order_id        uuid          not null references orders(id) on delete cascade,
  label           text          not null,
  file_name       text          not null,
  file_path       text          not null,
  uploaded_at     timestamptz   default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid          references auth.users(id)
);

alter table order_documents enable row level security;

-- Admin can do everything
create policy "Admin can manage order documents"
  on order_documents for all
  using (get_my_role() = 'admin');

-- Client can view own order docs
create policy "Client can view own order documents"
  on order_documents for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_documents.order_id
        and o.client_id = auth.uid()
    )
  );

-- Client can acknowledge (update) their own docs
create policy "Client can acknowledge own order documents"
  on order_documents for update
  using (
    exists (
      select 1 from orders o
      where o.id = order_documents.order_id
        and o.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from orders o
      where o.id = order_documents.order_id
        and o.client_id = auth.uid()
    )
  );

-- ── Storage bucket policy (run after creating the bucket in Dashboard) ──────
-- Allow authenticated admin uploads
-- (set via Dashboard → Storage → order-documents → Policies)
-- Or use the SQL below:

-- insert into storage.buckets (id, name, public) values ('order-documents', 'order-documents', false)
--   on conflict do nothing;

create policy "Admin can upload order documents"
  on storage.objects for insert
  with check (
    bucket_id = 'order-documents'
    and (select get_my_role()) = 'admin'
  );

create policy "Admin can delete order documents"
  on storage.objects for delete
  using (
    bucket_id = 'order-documents'
    and (select get_my_role()) = 'admin'
  );

create policy "Authenticated users can download order documents"
  on storage.objects for select
  using (
    bucket_id = 'order-documents'
    and auth.role() = 'authenticated'
  );
