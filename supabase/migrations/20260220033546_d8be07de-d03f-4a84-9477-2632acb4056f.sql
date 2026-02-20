-- Normalize legacy invoice_type values to new standard
UPDATE invoices SET invoice_type = 'ricevuta' WHERE invoice_type IN ('passive', 'expense');
UPDATE invoices SET invoice_type = 'emessa' WHERE invoice_type IN ('active', 'income');