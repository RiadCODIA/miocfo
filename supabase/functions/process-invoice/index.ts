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
  sender_vat?: string;
  recipient_name: string;
  invoice_direction: "emessa" | "ricevuta";
  category_name: string;
  taxable_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  due_date?: string;
  raw_data?: Record<string, unknown>;
}

interface DBCategory {
  id: string;
  name: string;
  category_type: string;
}

// P&L categories from spec
const REVENUE_CATEGORIES = [
  "Ricavi da vendita prodotti",
  "Ricavi da prestazione servizi",
  "Ricavi da canoni/abbonamenti",
  "Altre entrate",
];

const EXPENSE_CATEGORIES = [
  "Costi per materie prime / merci",
  "Costi per servizi esterni",
  "Affitti e locazioni",
  "Utenze",
  "Marketing e pubblicità",
  "Software e licenze",
  "Spese bancarie e assicurative",
  "Spese di viaggio e trasferte",
  "Spese di formazione",
  "Altre uscite",
];

async function fetchCategories(supabaseAdmin: ReturnType<typeof createClient>): Promise<DBCategory[]> {
  const { data, error } = await supabaseAdmin
    .from('cost_categories')
    .select('id, name, category_type')
    .eq('is_active', true)
    .order('sort_order');
  if (error) { console.error('Error fetching categories:', error); return []; }
  return data || [];
}

// Check supplier learning dictionary for this user
async function checkSupplierMapping(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  supplierVat: string | undefined
): Promise<string | null> {
  if (!supplierVat) return null;
  const { data } = await supabaseAdmin
    .from('supplier_category_mappings')
    .select('category_id')
    .eq('user_id', userId)
    .eq('supplier_vat', supplierVat)
    .maybeSingle();
  return data?.category_id || null;
}

// Save supplier → category mapping for future learning
async function saveSupplierMapping(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  supplierVat: string | undefined,
  supplierName: string | undefined,
  categoryId: string
) {
  if (!supplierVat) return;
  await supabaseAdmin
    .from('supplier_category_mappings')
    .upsert({
      user_id: userId,
      supplier_vat: supplierVat,
      supplier_name: supplierName || null,
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,supplier_vat' });
}

function resolveCategoryId(
  categories: DBCategory[],
  categoryName: string,
  invoiceDirection: string
): string | null {
  if (!categoryName) return null;
  const normalizedName = categoryName.trim().toLowerCase();

  // For emessa → resolve to revenue category
  // For ricevuta → resolve to expense category
  const targetType = invoiceDirection === 'emessa' ? 'revenue' : 'expense';
  const typedCats = categories.filter(c => c.category_type === targetType);

  // Exact match
  const exact = typedCats.find(c => c.name.toLowerCase() === normalizedName);
  if (exact) return exact.id;

  // Partial match
  const partial = typedCats.find(c =>
    c.name.toLowerCase().includes(normalizedName) || normalizedName.includes(c.name.toLowerCase())
  );
  if (partial) return partial.id;

  // Fallback: "Altre entrate" for emessa, "Altre uscite" for ricevuta
  const fallbackName = invoiceDirection === 'emessa' ? 'altre entrate' : 'altre uscite';
  const fallback = typedCats.find(c => c.name.toLowerCase().includes(fallbackName));
  if (fallback) return fallback.id;

  // Last resort: any category of the right type
  return typedCats.length > 0 ? typedCats[typedCats.length - 1].id : null;
}

function parseCSV(content: string): ExtractedInvoice[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV deve avere almeno una riga di intestazione e una riga di dati');

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
    if (h.includes('p.iva') || h.includes('piva') || h.includes('partita iva')) colMap.vat_number = i;
    if (h.includes('scadenza') || h.includes('due')) colMap.due_date = i;
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
        sender_vat: colMap.vat_number !== undefined ? values[colMap.vat_number] : undefined,
        recipient_name: isEmessa ? (values[colMap.client] || '') : '',
        invoice_direction: isEmessa ? 'emessa' : 'ricevuta',
        category_name: '',
        taxable_amount: taxableAmount,
        vat_rate: taxableAmount > 0 ? Math.round((vatAmount / taxableAmount) * 100) : 0,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        due_date: colMap.due_date !== undefined ? values[colMap.due_date] : undefined,
        currency: values[colMap.currency] || 'EUR',
        raw_data: { csv_row: i, original_values: values }
      };
      if (invoice.total_amount > 0) invoices.push(invoice);
    } catch (e: unknown) {
      console.log(`Skipping row ${i}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  return invoices;
}

function applyVATFallback(invoice: ExtractedInvoice): ExtractedInvoice {
  let { taxable_amount, vat_amount, vat_rate, total_amount } = invoice;

  if (vat_amount === 0 && total_amount > taxable_amount && taxable_amount > 0) {
    vat_amount = Math.round((total_amount - taxable_amount) * 100) / 100;
    if (vat_rate === 0 && taxable_amount > 0) vat_rate = Math.round((vat_amount / taxable_amount) * 100);
  }
  if (vat_amount === 0 && vat_rate > 0 && taxable_amount > 0) {
    vat_amount = Math.round((taxable_amount * vat_rate / 100) * 100) / 100;
    total_amount = taxable_amount + vat_amount;
  }
  if (taxable_amount === total_amount && vat_rate > 0 && vat_amount === 0) {
    taxable_amount = Math.round((total_amount / (1 + vat_rate / 100)) * 100) / 100;
    vat_amount = Math.round((total_amount - taxable_amount) * 100) / 100;
  }
  if (taxable_amount === total_amount && vat_rate === 0 && vat_amount === 0 && total_amount > 0) {
    vat_rate = 22;
    taxable_amount = Math.round((total_amount / 1.22) * 100) / 100;
    vat_amount = Math.round((total_amount - taxable_amount) * 100) / 100;
  }

  return { ...invoice, taxable_amount, vat_amount, vat_rate, total_amount };
}

async function extractInvoiceWithAI(fileData: Uint8Array, fileName: string, userCompanyName?: string, categoryNames?: string[]): Promise<ExtractedInvoice> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.warn('LOVABLE_API_KEY non configurata');
    return {
      invoice_number: `PDF-${Date.now()}`, invoice_date: new Date().toISOString().split('T')[0],
      sender_name: 'Fornitore Sconosciuto', recipient_name: '', invoice_direction: 'ricevuta',
      category_name: '', taxable_amount: 0, vat_rate: 0, vat_amount: 0, total_amount: 0, currency: 'EUR',
      raw_data: { note: 'API key mancante', file_name: fileName }
    };
  }

  try {
    let binaryStr = '';
    const chunkSize = 8192;
    for (let i = 0; i < fileData.length; i += chunkSize) {
      const chunk = fileData.subarray(i, i + chunkSize);
      for (let j = 0; j < chunk.length; j++) binaryStr += String.fromCharCode(chunk[j]);
    }
    const base64Data = btoa(binaryStr);
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const mimeType = isImage ? `image/${fileName.split('.').pop()?.toLowerCase().replace('jpg', 'jpeg')}` : 'application/pdf';

    const companyContext = userCompanyName
      ? `\nL'azienda dell'utente si chiama: "${userCompanyName}". Se appare come MITTENTE → "emessa". Se DESTINATARIO → "ricevuta".`
      : '';

    const revenueCatList = REVENUE_CATEGORIES.join(', ');
    const expenseCatList = EXPENSE_CATEGORIES.join(', ');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Sei un ESPERTO CONTABILE italiano. Analizza questa fattura ed estrai i seguenti dati in formato JSON:

{
  "invoice_number": "numero fattura",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD (data scadenza pagamento, se presente)",
  "sender_name": "ragione sociale emittente",
  "sender_vat": "P.IVA emittente (solo numeri, senza prefisso IT)",
  "recipient_name": "ragione sociale destinatario",
  "invoice_direction": "emessa" o "ricevuta",
  "category_name": "categoria dal Conto Economico (vedi sotto)",
  "taxable_amount": importo IMPONIBILE (base imponibile PRIMA dell'IVA),
  "vat_rate": aliquota IVA (es. 22, 10, 4, 0),
  "vat_amount": importo IVA in euro,
  "total_amount": TOTALE DOCUMENTO IVA inclusa
}

CATEGORIE CONTO ECONOMICO:
- Se fattura EMESSA (invoice_direction="emessa"), scegli tra: [${revenueCatList}]
- Se fattura RICEVUTA (invoice_direction="ricevuta"), scegli tra: [${expenseCatList}]

PRIORITÀ CLASSIFICAZIONE:
1. Analizza le DESCRIZIONI RIGHE della fattura
2. Considera la ragione sociale / P.IVA del fornitore
3. Se non riesci a classificare con confidenza → usa "Altre entrate" (emessa) o "Altre uscite" (ricevuta)

REGOLE CRITICHE:
- Separa SEMPRE imponibile e IVA
- Se trovi solo il totale, assumi IVA 22%: taxable = total/1.22
- La data scadenza si trova spesso in "DettaglioPagamento" o "Scadenza" o "Data Pagamento"
${companyContext}

Rispondi SOLO con il JSON valido.`
            },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      if (response.status === 429) throw new Error('Rate limit superato');
      if (response.status === 402) throw new Error('Quota AI esaurita');
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const extracted = JSON.parse(jsonStr);
    const parseNum = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
      return 0;
    };

    const direction = (extracted.invoice_direction === 'emessa') ? 'emessa' : 'ricevuta';
    let result_invoice: ExtractedInvoice = {
      invoice_number: extracted.invoice_number || `PDF-${Date.now()}`,
      invoice_date: extracted.invoice_date || new Date().toISOString().split('T')[0],
      sender_name: extracted.sender_name || 'Sconosciuto',
      sender_vat: extracted.sender_vat || undefined,
      recipient_name: extracted.recipient_name || '',
      invoice_direction: direction,
      category_name: extracted.category_name || '',
      taxable_amount: parseNum(extracted.taxable_amount),
      vat_rate: parseNum(extracted.vat_rate),
      vat_amount: parseNum(extracted.vat_amount),
      total_amount: parseNum(extracted.total_amount) || (parseNum(extracted.taxable_amount) + parseNum(extracted.vat_amount)),
      due_date: extracted.due_date || undefined,
      currency: 'EUR',
      raw_data: { ai_extracted: true, original_filename: fileName, ai_response: extracted }
    };

    result_invoice = applyVATFallback(result_invoice);
    console.log(`Extracted: direction=${direction}, sender=${result_invoice.sender_name}, vat=${result_invoice.sender_vat}, taxable=€${result_invoice.taxable_amount}, VAT=€${result_invoice.vat_amount}, due=${result_invoice.due_date}`);
    return result_invoice;

  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      invoice_number: `PDF-${Date.now()}`, invoice_date: new Date().toISOString().split('T')[0],
      sender_name: 'Fornitore Sconosciuto', recipient_name: '', invoice_direction: 'ricevuta',
      category_name: '', taxable_amount: 0, vat_rate: 0, vat_amount: 0, total_amount: 0, currency: 'EUR',
      raw_data: { error: error instanceof Error ? error.message : 'Unknown', file_name: fileName }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
        const { data: profile } = await supabaseAdmin.from('profiles').select('company_name').eq('id', user.id).single();
        if (profile?.company_name) userCompanyName = profile.company_name;
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
        const { data: existingInvoice, error: fetchError } = await supabaseAdmin
          .from('invoices').select('*').eq('id', body.reprocessInvoiceId).single();
        if (fetchError || !existingInvoice) throw new Error(`Fattura non trovata: ${fetchError?.message}`);

        storagePath = existingInvoice.file_path;
        fileName = existingInvoice.file_name;
        fileType = existingInvoice.file_type || fileName.split('.').pop()?.toLowerCase() || '';
        userId = existingInvoice.user_id;

        const { data: profile } = await supabaseAdmin.from('profiles').select('company_name').eq('id', userId).single();
        if (profile?.company_name) userCompanyName = profile.company_name;

        const { data: downloadData, error: downloadError } = await supabaseAdmin.storage.from('invoices').download(storagePath);
        if (downloadError || !downloadData) throw new Error(`Errore download: ${downloadError?.message}`);
        fileData = new Uint8Array(await downloadData.arrayBuffer());

        const categories = await fetchCategories(supabaseAdmin);
        const extracted = await extractInvoiceWithAI(fileData, fileName, userCompanyName, categories.map(c => c.name));

        // Check supplier learning first
        let categoryId = await checkSupplierMapping(supabaseAdmin, userId, extracted.sender_vat);
        if (!categoryId) {
          categoryId = resolveCategoryId(categories, extracted.category_name, extracted.invoice_direction);
        }

        const { error: updateError } = await supabaseAdmin.from('invoices').update({
          invoice_number: extracted.invoice_number,
          invoice_date: extracted.invoice_date,
          due_date: extracted.due_date || null,
          vendor_name: extracted.invoice_direction === 'ricevuta' ? extracted.sender_name : null,
          client_name: extracted.invoice_direction === 'emessa' ? extracted.recipient_name : null,
          amount: extracted.taxable_amount,
          vat_amount: extracted.vat_amount,
          total_amount: extracted.total_amount,
          invoice_type: extracted.invoice_direction,
          category_id: categoryId,
          extracted_data: {
            ...(extracted.raw_data as Record<string, unknown> ?? {}),
            sender_name: extracted.sender_name, sender_vat: extracted.sender_vat,
            recipient_name: extracted.recipient_name, category_name: extracted.category_name,
            vat_rate: extracted.vat_rate, due_date: extracted.due_date,
          },
          updated_at: new Date().toISOString()
        }).eq('id', body.reprocessInvoiceId);

        if (updateError) throw new Error(`Errore aggiornamento: ${updateError.message}`);

        // Save supplier mapping for learning
        if (categoryId && extracted.sender_vat) {
          await saveSupplierMapping(supabaseAdmin, userId, extracted.sender_vat, extracted.sender_name, categoryId);
        }

        return new Response(JSON.stringify({ success: true, reprocessed: true, invoice: extracted }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // NEW UPLOAD
      storagePath = body.storagePath;
      fileName = body.fileName;
      fileType = body.fileType || fileName.split('.').pop()?.toLowerCase() || '';
      userId = body.userId || userId;
      invoiceTypeOverride = body.invoiceType;

      const { data: downloadData, error: downloadError } = await supabaseAdmin.storage.from('invoices').download(storagePath);
      if (downloadError || !downloadData) throw new Error(`Errore download: ${downloadError?.message}`);
      fileData = new Uint8Array(await downloadData.arrayBuffer());

    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      if (!files || files.length === 0) throw new Error('Nessun file caricato');
      const file = files[0];
      fileName = file.name;
      fileType = file.type || fileName.split('.').pop()?.toLowerCase() || '';
      fileData = new Uint8Array(await file.arrayBuffer());
      storagePath = `${userId}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabaseAdmin.storage.from('invoices').upload(storagePath, fileData, {
        contentType: file.type || 'application/octet-stream'
      });
      if (uploadError) throw new Error(`Errore upload: ${uploadError.message}`);
    } else {
      throw new Error('Formato richiesta non valido');
    }

    let extractedInvoices: ExtractedInvoice[] = [];

    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      const content = new TextDecoder().decode(fileData);
      extractedInvoices = parseCSV(content);
    } else if (fileType === 'application/zip' || fileName.endsWith('.zip')) {
      extractedInvoices = [{
        invoice_number: `ZIP-${Date.now()}`, invoice_date: new Date().toISOString().split('T')[0],
        sender_name: fileName.replace('.zip', ''), recipient_name: '', invoice_direction: 'ricevuta',
        category_name: '', taxable_amount: 0, vat_rate: 0, vat_amount: 0, total_amount: 0, currency: 'EUR',
        raw_data: { note: 'ZIP non supportato' }
      }];
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf') ||
               fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(fileName)) {
      const categories = await fetchCategories(supabaseAdmin);
      const invoice = await extractInvoiceWithAI(fileData, fileName, userCompanyName, categories.map(c => c.name));
      extractedInvoices = [invoice];
    } else {
      throw new Error(`Tipo file non supportato: ${fileType}`);
    }

    const allCategories = await fetchCategories(supabaseAdmin);

    for (const invoice of extractedInvoices) {
      if (invoiceTypeOverride && ['emessa', 'ricevuta', 'autofattura'].includes(invoiceTypeOverride)) {
        invoice.invoice_direction = invoiceTypeOverride as 'emessa' | 'ricevuta';
      }

      // Check supplier learning dictionary first
      let categoryId = await checkSupplierMapping(supabaseAdmin, userId, invoice.sender_vat);
      if (!categoryId) {
        categoryId = resolveCategoryId(allCategories, invoice.category_name, invoice.invoice_direction);
      }

      const { error: insertError } = await supabaseAdmin.from('invoices').insert({
        user_id: userId,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date || null,
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
          sender_name: invoice.sender_name, sender_vat: invoice.sender_vat,
          recipient_name: invoice.recipient_name, category_name: invoice.category_name,
          vat_rate: invoice.vat_rate, due_date: invoice.due_date,
        },
        payment_status: 'pending'
      });
      if (insertError) throw new Error(`Errore inserimento: ${insertError.message}`);

      // Save supplier mapping for learning
      if (categoryId && invoice.sender_vat) {
        await saveSupplierMapping(supabaseAdmin, userId, invoice.sender_vat, invoice.sender_name, categoryId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, invoices_count: extractedInvoices.length, invoices: extractedInvoices }),
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
