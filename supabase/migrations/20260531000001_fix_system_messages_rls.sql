-- Fix CRIT-4: system_messages was publicly readable by anonymous users.
-- Drop the overly-broad policy and replace it with one that requires authentication.

-- Drop the existing anon/public read policy (name may vary — drop both common variants safely)
DROP POLICY IF EXISTS "Allow public read access" ON system_messages;
DROP POLICY IF EXISTS "Allow read access" ON system_messages;
DROP POLICY IF EXISTS "Public read system_messages" ON system_messages;
DROP POLICY IF EXISTS "Anyone can read system messages" ON system_messages;

-- Recreate as authenticated-only read
CREATE POLICY "Authenticated users can read system messages"
  ON system_messages
  FOR SELECT
  TO authenticated
  USING (true);
