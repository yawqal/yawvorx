-- YAWVOREX migration 004 (OPTIONAL): DEMONSTRATION data. Everything here is marked is_demo = true.
-- The Phase 3 pages still use their built-in demo data; Phase 5 connects the shop to these tables.
-- To remove it later:  delete from public.products where is_demo;  delete from public.portfolio_projects where is_demo;

insert into public.categories (scope, name, slug, sort_order) values
  ('product','Digital templates','digital-templates',1),
  ('product','Stationery','stationery',2),
  ('portfolio','Web','web',1)
on conflict (scope, slug) do nothing;

insert into public.products (category_id, slug, name, description, product_type, base_price, stock_quantity, status, is_demo)
select c.id, 'demo-brand-starter-kit', 'Brand Starter Kit', 'DEMO DATA: replace with a real product.', 'digital', 19, null, 'published', true
from public.categories c where c.scope = 'product' and c.slug = 'digital-templates'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, product_type, base_price, stock_quantity, status, is_demo)
select c.id, 'demo-notebook', 'Studio Notebook', 'DEMO DATA: replace with a real product.', 'physical', 14, 12, 'published', true
from public.categories c where c.scope = 'product' and c.slug = 'stationery'
on conflict (slug) do nothing;

insert into public.portfolio_projects (category_id, slug, title, summary, brief, approach, deliverables, tags, is_demo, status)
select c.id, 'concept-luxury-storefront', 'Luxury Storefront', 'DEMO DATA: sample concept, not client work.',
  'An imagined brief.', 'Dark premium surfaces with one accent colour.', array['Home and product page designs','Cart flow'], array['E-commerce'], true, 'published'
from public.categories c where c.scope = 'portfolio' and c.slug = 'web'
on conflict (slug) do nothing;

insert into public.site_settings (key, value, is_public) values
  ('brand', '{"tagline":"Beyond Digital. Beyond Ordinary."}', true),
  ('store', '{"currency":"USD"}', true),
  ('payment', '{"manual_instructions":"REPLACE_WITH_PAYMENT_INSTRUCTIONS"}', false)
on conflict (key) do nothing;
