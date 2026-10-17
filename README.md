# LedZap

CRM para vendas, atendimento via WhatsApp e gestão de cobranças.

## Stack
- Next.js / React / TypeScript
- Supabase Auth + PostgreSQL com Row Level Security por organização
- Evolution API configurável no servidor para QR, estado real e mensagens de texto
- Vercel via GitHub (branch de produção: `main`)

## Variáveis de ambiente
Configure `.env.local` localmente e as variáveis no painel Vercel. Nunca exponha segredos em variáveis `NEXT_PUBLIC_*`.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (somente servidor)
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY` (somente servidor)
- `EVOLUTION_INSTANCE_NAME`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (cron protegido de mensagens agendadas)

## Módulos
Landing page, cadastro/login, dashboard, CRM Kanban, tarefas, automações com consentimento, fila de agendamentos, clientes, planos, produtos, categorias, cobranças, recorrências, financeiro, relatórios e integração WhatsApp.

## Deploy e validação
Após configurar as chaves, teste cadastro e confirmação de e-mail, isolamento RLS entre organizações, conexão/QR real, envio por Evolution API, processamento da fila e webhooks de cobrança antes de abrir a plataforma para clientes.

A Vercel Hobby executa cron uma vez por dia e sem precisão por minuto. Envio agendado em intervalos curtos exige Vercel Pro ou um agendador externo.
