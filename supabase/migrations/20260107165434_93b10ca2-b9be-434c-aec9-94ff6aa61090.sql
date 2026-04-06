
-- Create audit_logs table for tracking admin/system access to sensitive data
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    action_type TEXT NOT NULL, -- 'read', 'write', 'delete'
    table_name TEXT NOT NULL,
    record_id UUID,
    user_id UUID, -- The user whose data was accessed
    accessed_by TEXT NOT NULL, -- 'service_role', 'admin', 'cron'
    accessor_id UUID, -- Admin user id if applicable
    details JSONB, -- Additional context
    ip_address TEXT
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only service role can insert audit logs (from edge functions)
CREATE POLICY "Deny user inserts on audit_logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (false);

-- Deny updates and deletes - audit logs should be immutable
CREATE POLICY "Deny updates on audit_logs"
ON public.audit_logs
FOR UPDATE
USING (false);

CREATE POLICY "Deny deletes on audit_logs"
ON public.audit_logs
FOR DELETE
USING (false);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Function to log admin access (called from edge functions via service role)
CREATE OR REPLACE FUNCTION public.log_admin_access(
    p_action_type TEXT,
    p_table_name TEXT,
    p_record_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_accessed_by TEXT DEFAULT 'service_role',
    p_accessor_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        action_type,
        table_name,
        record_id,
        user_id,
        accessed_by,
        accessor_id,
        details
    ) VALUES (
        p_action_type,
        p_table_name,
        p_record_id,
        p_user_id,
        p_accessed_by,
        p_accessor_id,
        p_details
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;
