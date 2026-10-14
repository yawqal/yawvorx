-- YAWVOREX 004 (OPTIONAL): DEMONSTRATION data, all marked is_demo = true. Uses YOUR column names.
-- The Phase 3 pages still use built-in demo data; Phase 5 connects the shop to these tables.
-- Remove later with:  delete from public.products where is_demo;  delete from public.portfolio_projects where is_demo;

insert into public.categories (name, slug) values ('Digital templates', 'digital-templates'), ('Stationery', 'stationery')
on conflict do nothing;

insert into public.products (category_id, slug, name, description, price, stock, is_published, product_type, is_demo)
select c.id, 'demo-brand-starter-kit', 'Brand Starter Kit', 'DEMO DATA: replace with a real product.', 19, 0, true, 'digital', true
from public.categories c where c.slug = 'digital-templates'
on conflict do nothing;

insert into public.products (category_id, slug, name, description, price, stock, is_published, product_type, is_demo)
select c.id, 'demo-notebook', 'Studio Notebook', 'DEMO DATA: replace with a real product.', 14, 12, true, 'physical', true
from public.categories c where c.slug = 'stationery'
on conflict do nothing;

insert into public.portfolio_projects (slug, title, category, summary, brief, approach, deliverables, tags, is_demo, is_published)
values ('concept-luxury-storefront', 'Luxury Storefront', 'Web', 'DEMO DATA: sample concept, not client work.',
        'An imagined brief.', 'Dark premium surfaces with one accent colour.', array['Home and product page designs','Cart flow'], array['E-commerce'], true, true)
on conflict do nothing;

insert into public.site_settings (key, value, is_public) values
  ('brand', '{"tagline":"Beyond Digital. Beyond Ordinary."}', true),
  ('store', '{"currency":"USD"}', true),
  ('payment', '{"manual_instructions":"REPLACE_WITH_PAYMENT_INSTRUCTIONS"}', false)
on conflict do nothing;
select 'OK: 004 finished' as result;
