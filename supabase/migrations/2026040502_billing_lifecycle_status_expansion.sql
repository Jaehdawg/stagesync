-- Expand billing account lifecycle statuses so trialing and canceled states can be stored.

alter table public.billing_accounts
  drop constraint if exists billing_accounts_status_check;

alter table public.billing_accounts
  add constraint billing_accounts_status_check
  check (status in ('free', 'trialing', 'active', 'grace', 'past_due', 'canceled', 'suspended'));
