
ALTER TABLE public.profiles 
ADD COLUMN is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN paypal_transaction_id text;
