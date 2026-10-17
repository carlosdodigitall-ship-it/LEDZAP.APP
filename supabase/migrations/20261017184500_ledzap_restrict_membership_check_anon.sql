-- Organization membership checks are used by authenticated RLS policies only.
-- Do not expose this SECURITY DEFINER helper as an anonymous RPC endpoint.
revoke execute on function public.is_org_member(uuid) from anon;
