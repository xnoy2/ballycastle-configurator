-- Add task_id to order_photos so photos can be reliably linked to and deleted with their task
alter table order_photos
  add column if not exists task_id uuid references stage_tasks(id) on delete set null;

create index if not exists order_photos_task_id_idx on order_photos(task_id);
