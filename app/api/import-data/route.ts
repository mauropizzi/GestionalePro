import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { anagraficaType, data } = await request.json();

    if (!anagraficaType || !data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Invalid request body: anagraficaType and non-empty data array are required.' }, { status: 400 });
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

    const processedData = data.map((row: any) => {
      const newRow = { ...row };

      // Convert 'attivo' string to boolean if it exists
      if (typeof newRow.attivo === 'string') {
        newRow.attivo = newRow.attivo.toLowerCase() === 'true' || newRow.attivo === '1';
      }

      // Handle date fields: parse and format to 'YYYY-MM-DD'
      const dateFields = [
        'data_nascita', 'data_assunzione', 'data_cessazione',
        'data_inizio_validita', 'data_fine_validita', 'data_ultima_revisione',
        'data_servizio'
      ];
      dateFields.forEach(field => {
        if (newRow[field] && typeof newRow[field] === 'string') {
          try {
            const date = new Date(newRow[field]);
            if (!isNaN(date.getTime())) {
              newRow[field] = format(date, 'yyyy-MM-dd');
            } else {
              newRow[field] = null;
            }
          } catch (e) {
            newRow[field] = null;
          }
        }
      });

      // Handle datetime fields: parse and format to ISO string
      const datetimeFields = [
        'data_inizio_servizio', 'data_fine_servizio'
      ];
      datetimeFields.forEach(field => {
        if (newRow[field] && typeof newRow[field] === 'string') {
          try {
            const date = new Date(newRow[field]);
            if (!isNaN(date.getTime())) {
              newRow[field] = date.toISOString();
            } else {
              newRow[field] = null;
            }
          } catch (e) {
            newRow[field] = null;
          }
        }
      });

      // Ensure UUID fields are null if empty string
      const uuidFields = [
        'id', 'client_id', 'punto_servizio_id', 'fornitore_id', 'cliente_id', 'richiesta_servizio_id'
      ];
      uuidFields.forEach(field => {
        if (newRow[field] === '') {
          newRow[field] = null;
        }
      });

      // Ensure numeric fields are null if empty string, and convert to number
      const numericFields = [
        'importo', 'supplier_rate', 'latitude', 'longitude', 'cadenza_ore', 'numero_agenti', 'total_hours_calculated'
      ];
      numericFields.forEach(field => {
        if (newRow[field] === '') {
          newRow[field] = null;
        } else if (typeof newRow[field] === 'string' && !isNaN(Number(newRow[field]))) {
          newRow[field] = Number(newRow[field]);
        }
      });

      // Remove empty strings for all other fields to ensure null is inserted if empty
      for (const key in newRow) {
        if (newRow[key] === '') {
          newRow[key] = null;
        }
      }

      return newRow;
    });

    const { error } = await supabaseAdmin
      .from(anagraficaType)
      .insert(processedData);

    if (error) {
      console.error(`Error inserting data into ${anagraficaType}:`, error);
      return NextResponse.json({ error: `Failed to import data: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Importazione per ${anagraficaType} completata con successo! ${processedData.length} record inseriti.` });
  } catch (error: any) {
    console.error('Error in import-data API:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}