
UPDATE public.bank_accounts 
SET bank_name = 'Revolut', name = 'Revolut' 
WHERE iban LIKE 'LT%' AND substring(iban from 5 for 5) = '32500';
