-- Allow users to update own plan_requests (for cancellation)
CREATE POLICY "Users can update own requests" ON plan_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);