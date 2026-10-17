-- Trigger functions are invoked by their table triggers. They are not an RPC API.
-- Prevent authenticated and anonymous clients from calling the SECURITY DEFINER function directly.
revoke execute on function public.queue_crm_whatsapp_automation() from public, anon, authenticated;
