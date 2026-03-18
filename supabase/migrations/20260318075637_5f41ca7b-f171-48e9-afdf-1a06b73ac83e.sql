
-- Remove the permissive user UPDATE policy that allows self-approval
DROP POLICY IF EXISTS "Users can update own requests" ON public.plan_requests;

-- Re-create a restricted UPDATE policy: users can only cancel their own pending requests
CREATE POLICY "Users can cancel own pending requests"
ON public.plan_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');
