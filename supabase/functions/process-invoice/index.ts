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
  sender_name: string;
  recipient_name: string;
  invoice_direction: "emessa" | "ricevuta";
  category_name: string;
  taxable_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  raw_data?: Record<string, unknown>;
}

interface DBCategory {
  id: string;
  name: string;
}

// Fetch all active cost categories from the database
async function fetchCategories(supabaseAdmin: ReturnType<typeof createClient>): Promise<DBCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('cost_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

// Resolve category_id from AI-suggested category name
function resolveCategoryId(
  categories: DBCategory[],
  categoryName: string,
  invoiceDirection: string
): string | null {
  if (invoiceDirection === 'emessa') return null;
  if (!categoryName) return null;

  const normalizedName = categoryName.trim().toLowerCase();
  
  // Exact match first
  const exact = categories.find(c => c.name.toLowerCase() === normalizedName);
  if (exact) return exact.id;

  // Partial/contains match
  const partial = categories.find(c => 
    c.name.toLowerCase().includes(normalizedName) || normalizedName.includes(c.name.toLowerCase())
  );
  if (partial) return partial.id;

  // Fallback to "Altro" if available
  const altro = categories.find(c => c.name.toLowerCase() === 'altro');
  return altro?.id || null;
}

// Parse CSV content into invoice records
function parseCSV(content: string): ExtractedInvoice[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV deve avere almeno una riga di intestazione e una riga di dati');
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const colMap: Record<string, number> = {};
  header.forEach((h, i) => {
    if (h.includes('numero') || h.includes('invoice') || h.includes('fattura')) colMap.invoice_number = i;
    if (h.includes('data') || h.includes('date')) colMap.date = i;
    if (h.includes('fornitore') || h.includes('supplier') || h.includes('vendor')) colMap.supplier = i;
    if (h.includes('cliente') || h.includes('client') || h.includes('customer')) colMap.client = i;
    if (h.includes('importo') || h.includes('amount') || h.includes('totale') || h.includes('total')) colMap.amount = i;
    if (h.includes('imponibile') || h.includes('taxable')) colMap.taxable = i;
    if (h.includes('iva') || h.includes('vat')) colMap.vat = i;
    if (h.includes('valuta') || h.includes('currency')) colMap.currency = i;
    if (h.includes('tipo') || h.includes('type') || h.includes('direzione')) colMap.type = i;
  });

  const invoices: ExtractedInvoice[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    
    try {
      const totalAmount = parseFloat(values[colMap.amount]?.replace(/[^\d.,\-]/g, '').replace(',', '.')) || 0;
      const taxableAmount = colMap.taxable !== undefined 
        ? parseFloat(values[colMap.taxable]?.replace(/[^\d.,\-]/g, '').replace(',', '.')) || totalAmount
        : totalAmount;
      const vatAmount = colMap.vat !== undefined
        ? parseFloat(values[colMap.vat]?.replace(/[^\d.,\-]/g, '').replace(',', '.')) || 0
        : 0;

      const typeVal = colMap.type !== undefined ? values[colMap.type]?.toLowerCase() : '';
      const isEmessa = typeVal.includes('emess') || typeVal.includes('vendita') || typeVal.includes('attiv');

      const invoice: ExtractedInvoice = {
        invoice_number: values[colMap.invoice_number] || `INV-${Date.now()}-${i}`,
        invoice_date: values[colMap.date] || new Date().toISOString().split('T')[0],
        sender_name: isEmessa ? '' : (values[colMap.supplier] || 'Fornitore Sconosciuto'),
        recipient_name: isEmessa ? (values[colMap.client] || '') : '',
        invoice_direction: isEmessa ? 'emessa' : 'ricevuta',
        category_name: '',
        taxable_amount: taxableAmount,
        vat_rate: taxableAmount > 0 ? Math.round((vatAmount / taxableAmount) * 100) : 0,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        currency: values[colMap.currency] || 'EUR',
        raw_data: { csv_row: i, original_values: values }
      };

      if (invoice.total_amount > 0) {
        invoices.push(invoice);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      console.log(`Skipping row ${i}: ${message}`);
    }
  }

  return invoices;
}

// Apply VAT fallback logic after AI extraction
function applyVATFallback(invoice: ExtractedInvoice): ExtractedInvoice {
  let { taxable_amount, vat_amount, vat_rate, total_amount } = invoice;

  // Case 1: vat_amount=0 but total > taxable → compute VAT as difference
  if (vat_amount === 0 && total_amount > taxable_amount && taxable_amount > 0) {
    vat_amount = Math.round((total_amount - taxable_amount) * 100) / 100;
    if (vat_rate === 0 && taxable_amount > 0) {
      vat_rate = Math.round((vat_amount / taxable_amount) * 100);
    }
    console.log(`VAT fallback (total-taxable): vat_amount=€${vat_amount}, vat_rate=${vat_rate}%`);
  }

  // Case 2: vat_amount=0, vat_rate>0, taxable>0 → compute VAT from rate
  if (vat_amount === 0 && vat_rate > 0 && taxable_amount > 0) {
    vat_amount = Math.round((taxable_amount * vat_rate / 100) * 100) / 100;
    total_amount = taxable_amount + vat_amount;
    console.log(`VAT fallback (rate): vat_amount=€${vat_amount}, total=€${total_amount}`);
  }

  // Case 3: taxable == total and vat_rate > 0 → scorporo IVA
  if (taxable_amount === total_amount && vat_rate > 0 && vat_amount === 0) {
    taxable_amount = Math.round((total_amount / (1 + vat_rate / 100)) * 100) / 100;
    vat_amount = Math.round((total_amount - taxable_amount) * 100) / 100;
    console.log(`VAT fallback (scorporo): taxable=€${taxable_amount}, vat_amount=€${vat_amount}`);
  }

  // Case 4: taxable == total, vat_rate=0, vat_amount=0 → assume 22% IVA (Italian standard)
  // This catches cases where AI completely failed to detect VAT
  if (taxable_amount === total_amount && vat_rate === 0 && vat_amount === 0 && total_amount > 0) {
    vat_rate = 22;
    taxable_amount = Math.round((total_amount / 1.22) * 100) / 100;
    vat_amount = Math.round((total_amount - taxable_amount) * 100) / 100;
    console.log(`VAT fallback (default 22%): taxable=€${taxable_amount}, vat_amount=€${vat_amount}`);
  }

  return {
    ...invoice,
    taxable_amount,
    vat_amount,
    vat_rate,
    total_amount,
  };
}

// Extract invoice data using Lovable AI Gateway (Google Gemini)
async function extractInvoiceWithAI(fileData: Uint8Array, fileName: string, userCompanyName?: string, categoryNames?: string[]): Promise<ExtractedInvoice> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.warn('LOVABLE_API_KEY non configurata, usando fallback');
    return {
      invoice_number: `PDF-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      sender_name: 'Fornitore Sconosciuto',
      recipient_name: '',
      invoice_direction: 'ricevuta',
      category_name: '',
      taxable_amount: 0,
      vat_rate: 0,
      vat_amount: 0,
      total_amount: 0,
      currency: 'EUR',
      raw_data: { note: 'Estrazione AI non disponibile - chiave API mancante', file_name: fileName }
    };
  }

  try {
    // Convert Uint8Array to base64 without spreading (avoids stack overflow on large files)
    let binaryStr = '';
    const chunkSize = 8192;
    for (let i = 0; i < fileData.length; i += chunkSize) {
      const chunk = fileData.subarray(i, i + chunkSize);
      for (let j = 0; j < chunk.length; j++) {
        binaryStr += String.fromCharCode(chunk[j]);
      }
    }
    const base64Data = btoa(binaryStr);
    
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const mimeType = isImage 
      ? `image/${fileName.split('.').pop()?.toLowerCase().replace('jpg', 'jpeg')}`
      : 'application/pdf';
    
    console.log(`Calling Lovable AI Gateway for: ${fileName} (${mimeType})`);

    const companyContext = userCompanyName 
      ? `\nL'azienda dell'utente si chiama: "${userCompanyName}". Se questa azienda appare come MITTENTE/EMITTENTE della fattura, allora la fattura è "emessa". Se appare come DESTINATARIO/CLIENTE, allora è "ricevuta".`
      : '';

    const categoryList = categoryNames && categoryNames.length > 0
      ? categoryNames.join(', ')
      : 'Affitto e utenze, Marketing, Forniture, Servizi professionali, Tecnologia e software, Viaggi e trasferte, Assicurazioni, Imposte e tasse, Altro';

    const categoryInstruction = `"category_name": "Scegli la categoria di costo PIÙ ADATTA tra queste opzioni: [${categoryList}]. Analizza la descrizione delle righe, l'oggetto e il tipo di servizio/prodotto nella fattura per determinare la categoria corretta. Se nessuna categoria corrisponde bene, usa 'Altro'. Per fatture emesse (invoice_direction='emessa') lascia stringa vuota."`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Sei un ESPERTO CONTABILE italiano. Analizza questa fattura come farebbe un commercialista esperto ed estrai TUTTI i seguenti dati in formato JSON:

{
  "invoice_number": "numero fattura completo (es. 94/2025, FA-123)",
  "invoice_date": "data fattura in formato YYYY-MM-DD",
  "sender_name": "ragione sociale completa di chi EMETTE la fattura (mittente, in alto nel documento)",
  "recipient_name": "ragione sociale completa di chi RICEVE la fattura (destinatario, spesso dopo 'Spett.le', 'Destinatario', 'Cliente')",
  "invoice_direction": "emessa" oppure "ricevuta" (vedi istruzioni sotto),
  ${categoryInstruction},
  "taxable_amount": importo IMPONIBILE (base imponibile PRIMA dell'IVA, solo numero decimale),
  "vat_rate": aliquota IVA applicata (es. 22, 10, 4, 0 per esente),
  "vat_amount": importo IVA in euro (solo numero decimale),
  "total_amount": TOTALE DOCUMENTO IVA inclusa (solo numero decimale)
}

ISTRUZIONI CRITICHE PER UN CONTABILE ESPERTO:

1. INTESTAZIONE MITTENTE: Chi emette la fattura è tipicamente in alto a sinistra o in alto nel documento, con logo, P.IVA, indirizzo.
2. INTESTAZIONE DESTINATARIO: Chi riceve la fattura è dopo "Spett.le", "Destinatario", "Cliente", "Fattura a", solitamente più in basso o a destra.
3. DIREZIONE FATTURA:
   - Se trovi "FATTURA DI VENDITA", "Fattura emessa", "Nota di credito emessa" → "emessa"
   - Se trovi "FATTURA DI ACQUISTO", "Fattura ricevuta" → "ricevuta"  
   - Di DEFAULT, se non riesci a determinare la direzione, usa "ricevuta" (fattura passiva/di acquisto)
   ${companyContext}
4. SEPARAZIONE IMPONIBILE E IVA - OBBLIGATORIA:
   DEVI SEMPRE separare l'imponibile dall'IVA, anche se nel documento non sono chiaramente distinti.
   - Cerca "Imponibile", "Base imponibile", "Totale imponibile" per trovare la base.
   - Cerca "IVA", "Imposta", "Tot. imposta" per l'importo IVA.
   - Se trovi solo il totale e l'aliquota, CALCOLA: taxable_amount = total / (1 + aliquota/100), vat_amount = total - taxable_amount.
   - Se trovi solo il totale SENZA aliquota, ASSUMI IVA al 22%: taxable_amount = total / 1.22, vat_amount = total - taxable_amount.
   - NON restituire MAI vat_amount = 0 se c'è un'aliquota IVA > 0 nel documento.
5. ALIQUOTA IVA: Identifica la percentuale IVA (4%, 10%, 22%, esente, ecc.). Se ci sono più aliquote, usa quella predominante.
6. CATEGORIA: Analizza le descrizioni delle righe della fattura (servizi, prodotti, consulenze, affitti, ecc.) e scegli la categoria più appropriata dalla lista fornita.

Rispondi SOLO con il JSON valido, nessun altro testo o spiegazione.`
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Data}` }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit superato - riprova tra qualche secondo');
      }
      if (response.status === 402) {
        throw new Error('Quota Lovable AI esaurita');
      }
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    console.log('Lovable AI raw response:', content);
    
    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const extracted = JSON.parse(jsonStr);
    
    console.log('Extracted data:', JSON.stringify(extracted));

    // Parse numbers safely
    const parseNum = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
      return 0;
    };

    const taxableAmount = parseNum(extracted.taxable_amount);
    const vatAmount = parseNum(extracted.vat_amount);
    const totalAmount = parseNum(extracted.total_amount);
    const vatRate = parseNum(extracted.vat_rate);

    const direction = (extracted.invoice_direction === 'emessa') ? 'emessa' : 'ricevuta';

    let result_invoice: ExtractedInvoice = {
      invoice_number: extracted.invoice_number || `PDF-${Date.now()}`,
      invoice_date: extracted.invoice_date || new Date().toISOString().split('T')[0],
      sender_name: extracted.sender_name || 'Sconosciuto',
      recipient_name: extracted.recipient_name || '',
      invoice_direction: direction,
      category_name: extracted.category_name || '',
      taxable_amount: taxableAmount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount || (taxableAmount + vatAmount),
      currency: 'EUR',
      raw_data: { ai_extracted: true, original_filename: fileName, ai_response: extracted }
    };

    // Apply VAT fallback logic
    result_invoice = applyVATFallback(result_invoice);

    console.log(`Successfully extracted: direction=${direction}, sender=${result_invoice.sender_name}, recipient=${result_invoice.recipient_name}, taxable=€${result_invoice.taxable_amount}, VAT=€${result_invoice.vat_amount} (${result_invoice.vat_rate}%), total=€${result_invoice.total_amount}`);

    return result_invoice;

  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      invoice_number: `PDF-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      sender_name: 'Fornitore Sconosciuto',
      recipient_name: '',
      invoice_direction: 'ricevuta',
      category_name: '',
      taxable_amount: 0,
      vat_rate: 0,
      vat_amount: 0,
      total_amount: 0,
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    let userId = '00000000-0000-0000-0000-000000000000';
    let userCompanyName: string | undefined;

    if (authHeader) {
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user) {
        userId = user.id;
        // Try to get user's company name for better direction detection
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('company_name')
          .eq('id', user.id)
          .single();
        if (profile?.company_name) {
          userCompanyName = profile.company_name;
        }
      }
    }

    const contentType = req.headers.get('content-type') || '';
    
    let storagePath: string;
    let fileName: string;
    let fileType: string;
    let fileData: Uint8Array;
    let invoiceTypeOverride: string | undefined;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      
      // REPROCESS MODE
      if (body.reprocessInvoiceId) {
        console.log(`Reprocessing invoice: ${body.reprocessInvoiceId}`);
        
        const { data: existingInvoice, error: fetchError } = await supabaseAdmin
          .from('invoices')
          .select('*')
          .eq('id', body.reprocessInvoiceId)
          .single();
        
        if (fetchError || !existingInvoice) {
          throw new Error(`Fattura non trovata: ${fetchError?.message || 'ID non valido'}`);
        }
        
        storagePath = existingInvoice.file_path;
        fileName = existingInvoice.file_name;
        fileType = existingInvoice.file_type || fileName.split('.').pop()?.toLowerCase() || '';
        userId = existingInvoice.user_id;

        // Get user company name for reprocessing
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('company_name')
          .eq('id', userId)
          .single();
        if (profile?.company_name) {
          userCompanyName = profile.company_name;
        }
        
        const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
          .from('invoices')
          .download(storagePath);

        if (downloadError || !downloadData) {
          throw new Error(`Errore download file: ${downloadError?.message || 'File non trovato'}`);
        }

        fileData = new Uint8Array(await downloadData.arrayBuffer());
        
        console.log(`Reprocessing file: ${fileName}`);
        
        // Fetch categories and extract with AI in one pass
        const categories = await fetchCategories(supabaseAdmin);
        const categoryNames = categories.map(c => c.name);
        const extracted = await extractInvoiceWithAI(fileData, fileName, userCompanyName, categoryNames);
        const categoryId = resolveCategoryId(categories, extracted.category_name, extracted.invoice_direction);
        console.log(`Auto-category for reprocess: category_name=${extracted.category_name}, categoryId=${categoryId}`);

        // Update the existing invoice record with full data
        const { error: updateError } = await supabaseAdmin
          .from('invoices')
          .update({
            invoice_number: extracted.invoice_number,
            invoice_date: extracted.invoice_date,
            vendor_name: extracted.invoice_direction === 'ricevuta' ? extracted.sender_name : null,
            client_name: extracted.invoice_direction === 'emessa' ? extracted.recipient_name : null,
            amount: extracted.taxable_amount,
            vat_amount: extracted.vat_amount,
            total_amount: extracted.total_amount,
            invoice_type: extracted.invoice_direction,
            category_id: categoryId,
            extracted_data: {
              ...(extracted.raw_data as Record<string, unknown> ?? {}),
              sender_name: extracted.sender_name,
              recipient_name: extracted.recipient_name,
              category_name: extracted.category_name,
              vat_rate: extracted.vat_rate,
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', body.reprocessInvoiceId);
        
        if (updateError) {
          throw new Error(`Errore aggiornamento: ${updateError.message}`);
        }
        
        console.log(`Reprocessed: direction=${extracted.invoice_direction}, taxable=€${extracted.taxable_amount}, VAT=€${extracted.vat_amount}, category=${categoryId}`);
        
        return new Response(
          JSON.stringify({
            success: true,
            reprocessed: true,
            invoice: extracted
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // NEW UPLOAD flow
      storagePath = body.storagePath;
      fileName = body.fileName;
      fileType = body.fileType || fileName.split('.').pop()?.toLowerCase() || '';
      userId = body.userId || userId;

      // User-provided invoice type override
      invoiceTypeOverride = body.invoiceType;

      console.log(`Processing file from storage: ${storagePath}`);

      const { data: downloadData, error: downloadError } = await supabaseAdmin.storage
        .from('invoices')
        .download(storagePath);

      if (downloadError || !downloadData) {
        throw new Error(`Errore download file: ${downloadError?.message || 'File non trovato'}`);
      }

      fileData = new Uint8Array(await downloadData.arrayBuffer());

    } else if (contentType.includes('multipart/form-data')) {
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
      const content = new TextDecoder().decode(fileData);
      extractedInvoices = parseCSV(content);
      console.log(`Extracted ${extractedInvoices.length} invoices from CSV`);

    } else if (fileType === 'application/zip' || fileName.endsWith('.zip')) {
      extractedInvoices = [{
        invoice_number: `ZIP-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        sender_name: fileName.replace('.zip', '').replace(/[_-]/g, ' '),
        recipient_name: '',
        invoice_direction: 'ricevuta',
        category_name: '',
        taxable_amount: 0,
        vat_rate: 0,
        vat_amount: 0,
        total_amount: 0,
        currency: 'EUR',
        raw_data: { note: 'Archivio ZIP caricato - estrazione automatica non disponibile', file_size: fileData.length }
      }];

    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('Using AI extraction for PDF');
      const categories = await fetchCategories(supabaseAdmin);
      const catNames = categories.map(c => c.name);
      const invoice = await extractInvoiceWithAI(fileData, fileName, userCompanyName, catNames);
      extractedInvoices = [invoice];

    } else if (fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
      console.log('Using AI extraction for image');
      const categories = await fetchCategories(supabaseAdmin);
      const catNames = categories.map(c => c.name);
      const invoice = await extractInvoiceWithAI(fileData, fileName, userCompanyName, catNames);
      extractedInvoices = [invoice];

    } else {
      throw new Error(`Tipo file non supportato: ${fileType}`);
    }

    // Fetch categories once for insert loop
    const allCategories = await fetchCategories(supabaseAdmin);

    // Apply user-provided invoice type override if present
    const invoiceTypeHint = contentType.includes('application/json') 
      ? (await Promise.resolve(invoiceTypeOverride)) 
      : undefined;

    // Insert invoices into database with full extracted data + auto-categorization
    for (const invoice of extractedInvoices) {
      // Override direction if user specified it
      if (invoiceTypeHint && ['emessa', 'ricevuta', 'autofattura'].includes(invoiceTypeHint)) {
        invoice.invoice_direction = invoiceTypeHint as 'emessa' | 'ricevuta';
        console.log(`User override: invoice_direction set to "${invoiceTypeHint}"`);
      }

      // Auto-assign category from AI-suggested name
      const categoryId = resolveCategoryId(allCategories, invoice.category_name, invoice.invoice_direction);
      console.log(`Auto-category: category_name=${invoice.category_name}, direction=${invoice.invoice_direction}, categoryId=${categoryId}`);

      const { error: insertError } = await supabaseAdmin
        .from('invoices')
        .insert({
          user_id: userId,
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          vendor_name: invoice.invoice_direction === 'ricevuta' ? invoice.sender_name : null,
          client_name: invoice.invoice_direction === 'emessa' ? invoice.recipient_name : null,
          amount: invoice.taxable_amount,
          vat_amount: invoice.vat_amount,
          total_amount: invoice.total_amount,
          invoice_type: invoice.invoice_direction,
          file_name: fileName,
          file_path: storagePath,
          category_id: categoryId,
          extracted_data: {
            ...(invoice.raw_data as Record<string, unknown> ?? {}),
            sender_name: invoice.sender_name,
            recipient_name: invoice.recipient_name,
            category_name: invoice.category_name,
            vat_rate: invoice.vat_rate,
          },
          payment_status: 'pending'
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
