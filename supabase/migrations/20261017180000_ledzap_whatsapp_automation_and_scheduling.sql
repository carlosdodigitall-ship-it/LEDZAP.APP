create extension if not exists pgcrypto;

-- CRM tables are included here as an idempotent safeguard for a fresh Supabase project.
create table if not exists public.crm_deals (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 customer_id uuid references public.customers(id) on delete set null,
 title text not null,
 company_name text,
 contact_name text,
 contact_phone text,
 value numeric(12,2) not null default 0 check (value >= 0),
 stage text not null default 'lead' check (stage in ('lead','qualified','proposal','negotiation','won','lost')),
 source text,
 next_action text,
 next_action_at timestamptz,
 owner_id uuid references auth.users(id) on delete set null,
 notes text,
 lost_reason text,
 whatsapp_opt_in boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.crm_deals add column if not exists whatsapp_opt_in boolean not null default false;
create table if not exists public.crm_activities (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 customer_id uuid references public.customers(id) on delete cascade,
 deal_id uuid references public.crm_deals(id) on delete cascade,
 assigned_to uuid references auth.users(id) on delete set null,
 title text not null,
 description text,
 activity_type text not null default 'task' check (activity_type in ('task','call','meeting','follow_up','note')),
 status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 due_at timestamptz,
 completed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_crm_deals_org_stage on public.crm_deals(organization_id,stage);
create index if not exists idx_crm_activities_org_due on public.crm_activities(organization_id,status,due_at);
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;
drop policy if exists "crm deals org members" on public.crm_deals;
create policy "crm deals org members" on public.crm_deals for all to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
drop policy if exists "crm activities org members" on public.crm_activities;
create policy "crm activities org members" on public.crm_activities for all to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
grant select,insert,update,delete on public.crm_deals to authenticated;
grant select,insert,update,delete on public.crm_activities to authenticated;

alter table public.customers add column if not exists whatsapp_opt_in boolean not null default false;
create table if not exists public.crm_automations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null,
 trigger_type text not null check(trigger_type in('lead_created','stage_changed')),
 config jsonb not null default '{}'::jsonb,
 active boolean not null default true,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_crm_automations_org_active on public.crm_automations(organization_id,active,trigger_type);
create table if not exists public.scheduled_messages (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 customer_id uuid references public.customers(id) on delete set null,
 deal_id uuid references public.crm_deals(id) on delete set null,
 whatsapp_instance_id uuid references public.whatsapp_instances(id) on delete set null,
 phone text not null,
 message text not null,
 scheduled_at timestamptz not null,
 status text not null default 'scheduled' check(status in('scheduled','processing','sent','failed','cancelled')),
 consent_confirmed boolean not null default false,
 consent_confirmed_at timestamptz,
 consent_confirmed_by uuid references auth.users(id) on delete set null,
 provider_message_id text,
 sent_at timestamptz,
 last_error text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_scheduled_messages_due on public.scheduled_messages(status,scheduled_at) where status='scheduled';
create index if not exists idx_scheduled_messages_org on public.scheduled_messages(organization_id,status,scheduled_at);
alter table public.crm_automations enable row level security;
alter table public.scheduled_messages enable row level security;
drop policy if exists "crm automations org members" on public.crm_automations;
create policy "crm automations org members" on public.crm_automations for all to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
drop policy if exists "scheduled messages org members" on public.scheduled_messages;
create policy "scheduled messages org members" on public.scheduled_messages for all to authenticated using(public.is_org_member(organization_id)) with check(public.is_org_member(organization_id));
grant select,insert,update,delete on public.crm_automations to authenticated;
grant select,insert,update,delete on public.scheduled_messages to authenticated;

create or replace function public.queue_crm_whatsapp_automation()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $function$
declare v_trigger text;v_phone text;v_message text;v_delay integer;a record;
begin
 if TG_OP='INSERT' then v_trigger:='lead_created';
 elsif NEW.stage is distinct from OLD.stage then v_trigger:='stage_changed';
 else return NEW; end if;
 if not coalesce(NEW.whatsapp_opt_in,false) then return NEW; end if;
 v_phone:=nullif(regexp_replace(coalesce(NEW.contact_phone,''),'[^0-9]','','g'),'');
 if v_phone is null and NEW.customer_id is not null then
  select nullif(regexp_replace(coalesce(c.phone,''),'[^0-9]','','g'),'') into v_phone from public.customers c
  where c.id=NEW.customer_id and c.organization_id=NEW.organization_id and c.whatsapp_opt_in=true limit 1;
 end if;
 if v_phone is null or length(v_phone)<10 then return NEW; end if;
 if NEW.customer_id is not null and not exists(select 1 from public.customers c where c.id=NEW.customer_id and c.organization_id=NEW.organization_id and c.whatsapp_opt_in=true) then return NEW; end if;
 for a in select id,config from public.crm_automations where organization_id=NEW.organization_id and trigger_type=v_trigger and active=true loop
  v_message:=coalesce(a.config->>'message_template','');if btrim(v_message)='' then continue;end if;
  v_delay:=case when coalesce(a.config->>'delay_minutes','') ~ '^[0-9]{1,5}$' then least((a.config->>'delay_minutes')::integer,43200) else 0 end;
  v_message:=replace(v_message,'{{nome}}',coalesce(NEW.contact_name,''));v_message:=replace(v_message,'{{empresa}}',coalesce(NEW.company_name,''));
  v_message:=replace(v_message,'{{oportunidade}}',coalesce(NEW.title,''));v_message:=replace(v_message,'{{etapa}}',coalesce(NEW.stage,''));
  insert into public.scheduled_messages(organization_id,deal_id,customer_id,phone,message,scheduled_at,status,consent_confirmed,consent_confirmed_at,consent_confirmed_by,created_by)
  values(NEW.organization_id,NEW.id,NEW.customer_id,v_phone,v_message,now()+make_interval(mins=>v_delay),'scheduled',true,now(),NEW.owner_id,NEW.owner_id);
 end loop;return NEW;
end;$function$;
drop trigger if exists trg_queue_crm_whatsapp_automation on public.crm_deals;
create trigger trg_queue_crm_whatsapp_automation after insert or update of stage on public.crm_deals for each row execute function public.queue_crm_whatsapp_automation();
