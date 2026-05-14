-- Worker notifications table
CREATE TABLE IF NOT EXISTS worker_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE worker_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can read own notifications"
  ON worker_notifications FOR SELECT TO authenticated
  USING (auth.uid() = worker_id);

CREATE POLICY "Workers can update own notifications"
  ON worker_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Authenticated users can insert worker notifications"
  ON worker_notifications FOR INSERT TO authenticated
  WITH CHECK (true);
