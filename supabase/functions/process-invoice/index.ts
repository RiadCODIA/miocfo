import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Extract invoice data using OpenAI Vision API
async function extractInvoiceWithAI(fileData: Uint8Array, fileName: string): Promise<ExtractedInvoice> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY non configurata, usando fallback');
    return {
      invoice_number: `PDF-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      supplier_name: 'Fornitore Sconosciuto',
      amount: 0,
      currency: 'EUR',
      raw_data: { note: 'Estrazione AI non disponibile - chiave API mancante', file_name: fileName }
    };
  }

  try {
    // Convert PDF to base64
    const base64Data = btoa(String.fromCharCode(...fileData));
    
    console.log(`Calling OpenAI Vision API for: ${fileName}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analizza questa fattura italiana ed estrai i seguenti dati in formato JSON:
{
  "invoice_number": "numero fattura (es. 94/2025)",
  "supplier_name": "nome completo fornitore/azienda emittente (es. Horeca Consulting Srl)",
  "amount": numero importo totale IVA inclusa (solo il numero, es. 1250.50),
  "invoice_date": "data fattura formato YYYY-MM-DD (es. 2025-01-15)"
}

IMPORTANTE:
- Estrai l'importo TOTALE della fattura (totale fattura o totale documento), non l'imponibile
- Il fornitore è chi EMETTE la fattura, non chi la riceve
- Rispondi SOLO con il JSON, nessun altro testo`
            },
            {
              type: 'image_url',
              image_url: { url: `data:application/pdf;base64,${base64Data}` }
            }
          ]
        }],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('OpenAI response:', JSON.stringify(result.choices?.[0]?.message?.content));
    
    const content = result.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const extracted = JSON.parse(jsonStr);
    
    console.log('Extracted data:', JSON.stringify(extracted));

    return {
      invoice_number: extracted.invoice_number || `PDF-${Date.now()}`,
      invoice_date: extracted.invoice_date || new Date().toISOString().split('T')[0],
      supplier_name: extracted.supplier_name || 'Fornitore Sconosciuto',
      amount: typeof extracted.amount === 'number' ? extracted.amount : parseFloat(String(extracted.amount).replace(',', '.')) || 0,
      currency: 'EUR',
      raw_data: { ai_extracted: true, original_filename: fileName, ai_response: extracted }
    };

  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      invoice_number: `PDF-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      supplier_name: 'Fornitore Sconosciuto',
      amount: 0,
      currency: 'EUR',
      raw_data: { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        file_name: fileName,
        note: 'Estrazione AI fallita'
      }
    };
  }
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

    // Create admin client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get user from auth header (optional)
    const authHeader = req.headers.get('Authorization');
    // UUID valido per utenti demo (non autenticati)
    let userId = '00000000-0000-0000-0000-000000000000';

    if (authHeader) {
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    const contentType = req.headers.get('content-type') || '';
    
    let storagePath: string;
    let fileName: string;
    let fileType: string;
    let fileData: Uint8Array;

    if (contentType.includes('application/json')) {
      // New flow: file already uploaded to storage
      const body = await req.json();
      storagePath = body.storagePath;
      fileName = body.fileName;
      fileType = body.fileType || fileName.split('.').pop()?.toLowerCase() || '';
      userId = body.userId || userId;

      console.log(`Processing file from storage: ${storagePath}`);

      // Download file from storage
      const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
        .from('invoices')
        .download(storagePath);

      if (downloadError || !downloadData) {
        throw new Error(`Errore download file: ${downloadError?.message || 'File non trovato'}`);
      }

      fileData = new Uint8Array(await downloadData.arrayBuffer());

    } else if (contentType.includes('multipart/form-data')) {
      // Legacy flow: file sent via FormData
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];

      if (!files || files.length === 0) {
        throw new Error('Nessun file caricato');
      }

      const file = files[0];
      fileName = file.name;
      fileType = file.type || fileName.split('.').pop()?.toLowerCase() || '';
      const fileBuffer = await file.arrayBuffer();
      fileData = new Uint8Array(fileBuffer);

      // Upload file to storage
      storagePath = `${userId}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('invoices')
        .upload(storagePath, fileData, {
          contentType: file.type || 'application/octet-stream'
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Errore upload: ${uploadError.message}`);
      }
    } else {
      throw new Error('Formato richiesta non valido');
    }

    console.log(`Processing file: ${fileName} (${fileType}), size: ${fileData.length}`);

    let extractedInvoices: ExtractedInvoice[] = [];

    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      // CSV file
      const content = new TextDecoder().decode(fileData);
      extractedInvoices = parseCSV(content);
      console.log(`Extracted ${extractedInvoices.length} invoices from CSV`);

    } else if (fileType === 'application/zip' || fileName.endsWith('.zip')) {
      // ZIP file - process as container (AI extraction not available for ZIP)
      extractedInvoices = [{
        invoice_number: `ZIP-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        supplier_name: fileName.replace('.zip', '').replace(/[_-]/g, ' '),
        amount: 0,
        currency: 'EUR',
        raw_data: { note: 'Archivio ZIP caricato - estrazione automatica non disponibile', file_size: fileData.length }
      }];
      console.log('ZIP file detected - basic processing');

    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // PDF file - use AI extraction
      console.log('Using AI extraction for PDF');
      const invoice = await extractInvoiceWithAI(fileData, fileName);
      extractedInvoices = [invoice];
      console.log(`AI extracted: ${invoice.supplier_name}, €${invoice.amount}`);

    } else if (fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
      // Image file - use AI extraction
      console.log('Using AI extraction for image');
      const invoice = await extractInvoiceWithAI(fileData, fileName);
      extractedInvoices = [invoice];

    } else {
      throw new Error(`Tipo file non supportato: ${fileType}`);
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

    console.log(`Total invoices processed: ${extractedInvoices.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        invoices_count: extractedInvoices.length,
        invoices: extractedInvoices
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
