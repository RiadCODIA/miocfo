
-- Insert sample Cassetto Fiscale invoices for testing
-- These simulate real invoices that would be imported from A-Cube in production
INSERT INTO public.invoices (
  user_id,
  invoice_number,
  invoice_date,
  due_date,
  vendor_name,
  client_name,
  amount,
  vat_amount,
  total_amount,
  invoice_type,
  payment_status,
  source,
  acube_invoice_id,
  file_name,
  notes
)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  inv.invoice_number,
  inv.invoice_date::date,
  inv.due_date::date,
  inv.vendor_name,
  inv.client_name,
  inv.amount,
  inv.vat_amount,
  inv.total_amount,
  inv.invoice_type,
  inv.payment_status,
  'cassetto_fiscale',
  inv.acube_invoice_id,
  inv.file_name,
  'Fattura di test importata da Cassetto Fiscale (sandbox)'
FROM (VALUES
  ('FT-2025-001', '2025-01-15', '2025-02-15', 'Fornitore SRL', NULL,        1640.98, 360.02, 2001.00, 'ricevuta', 'paid',    'ACUBE-TEST-001', 'CF-FT-2025-001.xml'),
  ('FT-2025-002', '2025-02-03', '2025-03-03', 'Consulenza IT SpA', NULL,    820.49,  179.51, 1000.00, 'ricevuta', 'pending', 'ACUBE-TEST-002', 'CF-FT-2025-002.xml'),
  ('FT-2025-003', '2025-02-20', '2025-03-20', 'Affitti Uffici Srl', NULL,   1500.00, 330.00, 1830.00, 'ricevuta', 'pending', 'ACUBE-TEST-003', 'CF-FT-2025-003.xml'),
  ('FT-2025-004', '2025-03-01', '2025-04-01', 'Energia Verde SpA', NULL,    410.66,  89.34,  500.00,  'ricevuta', 'paid',    'ACUBE-TEST-004', 'CF-FT-2025-004.xml'),
  ('FT-2025-005', '2025-03-15', '2025-04-15', NULL, 'Cliente ABC Srl',      4098.36, 901.64, 5000.00, 'emessa',   'paid',    'ACUBE-TEST-005', 'CF-FT-2025-005.xml'),
  ('FT-2025-006', '2025-04-10', '2025-05-10', NULL, 'Cliente XYZ SpA',      2459.02, 540.98, 3000.00, 'emessa',   'pending', 'ACUBE-TEST-006', 'CF-FT-2025-006.xml'),
  ('FT-2025-007', '2025-04-22', '2025-05-22', 'Software House Srl', NULL,   655.74,  144.26, 800.00,  'ricevuta', 'pending', 'ACUBE-TEST-007', 'CF-FT-2025-007.xml'),
  ('FT-2025-008', '2025-05-05', '2025-06-05', 'Commercialista Rossi', NULL, 491.80,  108.20, 600.00,  'ricevuta', 'paid',    'ACUBE-TEST-008', 'CF-FT-2025-008.xml'),
  ('FT-2025-009', '2025-05-18', '2025-06-18', NULL, 'Cliente DEF Srl',      1639.34, 360.66, 2000.00, 'emessa',   'paid',    'ACUBE-TEST-009', 'CF-FT-2025-009.xml'),
  ('FT-2025-010', '2025-06-01', '2025-07-01', 'Telco Provider SpA', NULL,   163.93,  36.07,  200.00,  'ricevuta', 'paid',    'ACUBE-TEST-010', 'CF-FT-2025-010.xml')
) AS inv(invoice_number, invoice_date, due_date, vendor_name, client_name, amount, vat_amount, total_amount, invoice_type, payment_status, acube_invoice_id, file_name)
-- Only insert if not already present
WHERE NOT EXISTS (
  SELECT 1 FROM public.invoices WHERE acube_invoice_id = inv.acube_invoice_id
);
