import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anagraficaType = searchParams.get('type');

    if (!anagraficaType) {
      return NextResponse.json({ error: 'Il tipo di anagrafica è richiesto' }, { status: 400 });
    }

    const allowedTables = [
      "clienti",
      "fornitori",
      "punti_servizio",
      "personale",
      "operatori_network",
      "procedure",
      "tariffe",
      "richieste_servizio",
      "richieste_servizio_orari_giornalieri",
      "richieste_servizio_ispezioni"
    ];

    if (!allowedTables.includes(anagraficaType)) {
      return NextResponse.json({ error: `Invalid anagraficaType: ${anagraficaType}` }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: fetchedData, error: dbError } = await supabaseAdmin
      .from(anagraficaType)
      .select('*');

    if (dbError) {
      console.error(`Error fetching data from ${anagraficaType}:`, dbError);
      return NextResponse.json({ error: `Failed to export data: ${dbError.message}` }, { status: 500 });
    }

    if (!fetchedData || fetchedData.length === 0) {
      return NextResponse.json({ message: `Nessun dato trovato per ${anagraficaType} da esportare.` }, { status: 200 });
    }

    const processedData = fetchedData.map((row: any) => {
      const newRow = { ...row };
      // Convert boolean 'attivo' to string 'true'/'false' for better Excel readability
      if (typeof newRow.attivo === 'boolean') {
        newRow.attivo = newRow.attivo ? 'true' : 'false';
      }
      // Format date fields to 'YYYY-MM-DD'
      const dateFields = [
        'data_nascita', 'data_assunzione', 'data_cessazione',
        'data_inizio_validita', 'data_fine_validita', 'data_ultima_revisione',
        'data_servizio'
      ];
      dateFields.forEach(field => {
        if (newRow[field]) {
          try {
            const date = new Date(newRow[field]);
            if (!isNaN(date.getTime())) {
              newRow[field] = format(date, 'yyyy-MM-dd');
            }
          } catch (e) {
            // Keep original value if parsing fails
          }
        }
      });
      // Format datetime fields to 'YYYY-MM-DD HH:mm:ss'
      const datetimeFields = [
        'created_at', 'updated_at', 'data_inizio_servizio', 'data_fine_servizio'
      ];
      datetimeFields.forEach(field => {
        if (newRow[field]) {
          try {
            const date = new Date(newRow[field]);
            if (!isNaN(date.getTime())) {
              newRow[field] = format(date, 'yyyy-MM-dd HH:mm:ss');
            }
          } catch (e) {
            // Keep original value if parsing fails
          }
        }
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(processedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, anagraficaType);

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename=${anagraficaType}_export.xlsx`);

    return new NextResponse(excelBuffer, { headers });

  } catch (error: any) {
    console.error('Error in export-data API:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}