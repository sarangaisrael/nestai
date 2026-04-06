-- Create a function to validate push subscription endpoints
-- Only allow known push service providers (Google, Mozilla, Microsoft, Apple)
CREATE OR REPLACE FUNCTION public.validate_push_endpoint()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that the endpoint is from a known push service provider
  IF NEW.endpoint IS NOT NULL AND NOT (
    NEW.endpoint LIKE 'https://fcm.googleapis.com/%' OR
    NEW.endpoint LIKE 'https://android.googleapis.com/%' OR
    NEW.endpoint LIKE 'https://updates.push.services.mozilla.com/%' OR
    NEW.endpoint LIKE 'https://%push.services.mozilla.com/%' OR
    NEW.endpoint LIKE 'https://%notify.windows.com/%' OR
    NEW.endpoint LIKE 'https://%push.apple.com/%' OR
    NEW.endpoint LIKE 'https://web.push.apple.com/%'
  ) THEN
    RAISE EXCEPTION 'Invalid push endpoint: must be from a trusted push service provider';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate endpoints on insert and update
CREATE TRIGGER validate_push_endpoint_trigger
  BEFORE INSERT OR UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_push_endpoint();