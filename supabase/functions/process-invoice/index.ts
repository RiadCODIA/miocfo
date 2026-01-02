import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedInvoice {
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  amount: number;
  currency: string;
  raw_data?: Record<string, unknown>;
}

// Parse CSV content into invoice records
function parseCSV(content: string): ExtractedInvoice[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV deve avere almeno una riga di intestazione e una riga di dati');
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  // Map common header names
  const colMap: Record<string, number> = {};
  header.forEach((h, i) => {
    if (h.includes('numero') || h.includes('invoice') || h.includes('fattura')) colMap.invoice_number = i;
    if (h.includes('data') || h.includes('date')) colMap.date = i;
    if (h.includes('fornitore') || h.includes('supplier') || h.includes('vendor')) colMap.supplier = i;
    if (h.includes('importo') || h.includes('amount') || h.includes('totale') || h.includes('total')) colMap.amount = i;
    if (h.includes('valuta') || h.includes('currency')) colMap.currency = i;
  });

  const invoices: ExtractedInvoice[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    
    try {
      const invoice: ExtractedInvoice = {
        invoice_number: values[colMap.invoice_number] || `INV-${Date.now()}-${i}`,
        invoice_date: values[colMap.date] || new Date().toISOString().split('T')[0],
        supplier_name: values[colMap.supplier] || 'Fornitore Sconosciuto',
        amount: parseFloat(values[colMap.amount]?.replace(/[^\d.,\-]/g, '').replace(',', '.')) || 0,
        currency: values[colMap.currency] || 'EUR',
        raw_data: { csv_row: i, original_values: values }
      };

      if (invoice.amount > 0) {
        invoices.push(invoice);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.log(`Skipping row ${i}: ${message}`);
    }
  }

  return invoices;
}

// Extract invoice data from PDF text using regex patterns
function extractFromPDFText(text: string, fileName: string): ExtractedInvoice {
  // Common patterns for Italian invoices
  const invoiceNumberPatterns = [
    /(?:fattura|invoice|n[°.]?)\s*(?:n[°.]?)?\s*[:.]?\s*([A-Z0-9\-\/]+)/i,
    /(?:numero|nr|num)\s*[:.]?\s*([A-Z0-9\-\/]+)/i,
    /([A-Z]{2,3}[\-\/]?\d{4}[\-\/]?\d{2,6})/i,
  ];

  const amountPatterns = [
    /(?:totale|total|importo|amount)\s*(?:fattura|invoice|dovuto|due)?\s*[:.]?\s*[€$]?\s*([\d.,]+)/i,
    /[€$]\s*([\d.,]+)\s*(?:eur|euro)?/i,
    /(?:eur|euro)\s*([\d.,]+)/i,
  ];

  const datePatterns = [
    /(?:data|date)\s*[:.]?\s*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i,
    /(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/,
  ];

  const supplierPatterns = [
    /(?:ragione\s*sociale|company|supplier|fornitore)\s*[:.]?\s*([A-Za-z0-9\s&.,]+?)(?:\n|$)/i,
    /^([A-Z][A-Za-z0-9\s&.,]{5,50}(?:S\.?[rp]\.?[la]\.?|S\.?a\.?s\.?|S\.?n\.?c\.?))/m,
  ];

  let invoiceNumber = '';
  let amount = 0;
  let invoiceDate = new Date().toISOString().split('T')[0];
  let supplierName = 'Fornitore Sconosciuto';

  // Extract invoice number
  for (const pattern of invoiceNumberPatterns) {
    const match = text.match(pattern);
    if (match) {
      invoiceNumber = match[1].trim();
      break;
    }
  }

  // Extract amount
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/\./g, '').replace(',', '.');
      amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) break;
    }
  }

  // Extract date
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parts = match[1].split(/[\/.]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = '20' + year;
        invoiceDate = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  // Extract supplier
  for (const pattern of supplierPatterns) {
    const match = text.match(pattern);
    if (match) {
      supplierName = match[1].trim().substring(0, 100);
      break;
    }
  }

  // Fallback: use filename for invoice number
  if (!invoiceNumber) {
    invoiceNumber = fileName.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9]/g, '-').toUpperCase();
  }

  return {
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    supplier_name: supplierName,
    amount: amount || 0,
    currency: 'EUR',
    raw_data: { extracted_text_preview: text.substring(0, 500) }
  };
}

// Basic PDF text extraction (simplified - extracts readable text)
function extractPDFText(data: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const content = decoder.decode(data);
  
  // Extract text between stream and endstream (simplified extraction)
  const textParts: string[] = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  
  while ((match = streamRegex.exec(content)) !== null) {
    // Try to find readable text in the stream
    const streamContent = match[1];
    // Extract text from Tj/TJ operators
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      textParts.push(tjMatch[1]);
    }
  }

  // Also try to find readable text directly
  const readableRegex = /[\w\s€$.,\-\/]{10,}/g;
  let readable;
  while ((readable = readableRegex.exec(content)) !== null) {
    if (!readable[0].includes('stream') && !readable[0].includes('obj')) {
      textParts.push(readable[0]);
    }
  }

  return textParts.join(' ').substring(0, 10000);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Try to get user from auth header (optional)
    const authHeader = req.headers.get('Authorization');
    let userId = `demo-user-${Date.now()}`;

    if (authHeader) {
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    // Create admin client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      throw new Error('Nessun file caricato');
    }

    console.log(`Processing ${files.length} files for user ${userId}`);

    const results: { fileName: string; invoices: ExtractedInvoice[]; error?: string }[] = [];

    for (const file of files) {
      const fileName = file.name;
      const fileType = file.type || fileName.split('.').pop()?.toLowerCase();
      const fileBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);

      console.log(`Processing file: ${fileName} (${fileType})`);

      try {
        let extractedInvoices: ExtractedInvoice[] = [];

        if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
          // CSV file
          const content = new TextDecoder().decode(fileData);
          extractedInvoices = parseCSV(content);
          console.log(`Extracted ${extractedInvoices.length} invoices from CSV`);

        } else if (fileType === 'application/zip' || fileName.endsWith('.zip')) {
          // ZIP file - we'll process it as a container
          // For simplicity, we'll note it as a single entry with raw data
          // Full ZIP extraction would require a zip library
          extractedInvoices = [{
            invoice_number: `ZIP-${Date.now()}`,
            invoice_date: new Date().toISOString().split('T')[0],
            supplier_name: 'Archivio ZIP',
            amount: 0,
            currency: 'EUR',
            raw_data: { note: 'Archivio ZIP - estrazione manuale richiesta', file_size: fileData.length }
          }];
          console.log('ZIP file detected - basic processing');

        } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          // PDF file
          const pdfText = extractPDFText(fileData);
          console.log(`Extracted PDF text length: ${pdfText.length}`);
          const invoice = extractFromPDFText(pdfText, fileName);
          extractedInvoices = [invoice];

        } else if (fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
          // Image file - would need OCR, for now just note it
          extractedInvoices = [{
            invoice_number: `IMG-${Date.now()}`,
            invoice_date: new Date().toISOString().split('T')[0],
            supplier_name: 'Immagine Fattura',
            amount: 0,
            currency: 'EUR',
            raw_data: { note: 'Immagine - inserimento manuale richiesto', file_name: fileName }
          }];

        } else {
          throw new Error(`Tipo file non supportato: ${fileType}`);
        }

        // Upload file to storage
        const storagePath = `${userId}/${Date.now()}-${fileName}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('invoices')
          .upload(storagePath, fileData, {
            contentType: file.type || 'application/octet-stream'
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Errore upload: ${uploadError.message}`);
        }

        // Insert invoices into database
        for (const invoice of extractedInvoices) {
          const { error: insertError } = await supabaseAdmin
            .from('invoices')
            .insert({
              user_id: userId,
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              supplier_name: invoice.supplier_name,
              amount: invoice.amount,
              currency: invoice.currency,
              file_name: fileName,
              file_path: storagePath,
              file_type: fileType,
              raw_data: invoice.raw_data,
              match_status: 'pending'
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Errore inserimento: ${insertError.message}`);
          }
        }

        results.push({ fileName, invoices: extractedInvoices });

      } catch (fileError: unknown) {
        const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';
        console.error(`Error processing ${fileName}:`, fileError);
        results.push({ fileName, invoices: [], error: errorMessage });
      }
    }

    const totalInvoices = results.reduce((sum, r) => sum + r.invoices.length, 0);
    console.log(`Total invoices processed: ${totalInvoices}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        total_invoices: totalInvoices,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Process invoice error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
