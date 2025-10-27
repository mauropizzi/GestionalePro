import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anagraficaType = searchParams.get('type');

    if (!anagraficaType) {
      return NextResponse.json({ error: 'Il tipo di anagrafica è richiesto' }, { status: 400 });
    }

    console.log(`Simulazione esportazione per ${anagraficaType}.`);
    // In una vera applicazione, qui faresti:
    // 1. Recupero dei dati dal database (es. Supabase) in base a anagraficaType
    // 2. Trasformazione dei dati se necessario

    // Dati fittizi per la simulazione
    let dataToExport: any[] = [];
    switch (anagraficaType) {
      case 'clienti':
        dataToExport = [
          { id: 'cli001', ragione_sociale: 'Azienda Alpha S.r.l.', p_iva: 'IT12345678901', email: 'info@alpha.com', telefono: '0212345678' },
          { id: 'cli002', ragione_sociale: 'Beta S.p.A.', p_iva: 'IT09876543210', email: 'contatti@beta.it', telefono: '0698765432' },
        ];
        break;
      case 'fornitori':
        dataToExport = [
          { id: 'for001', ragione_sociale: 'Fornitore Uno S.a.s.', p_iva: 'IT11223344556', indirizzo: 'Via del Commercio 1, Roma' },
          { id: 'for002', ragione_sociale: 'Fornitore Due S.r.l.', p_iva: 'IT66554433221', indirizzo: 'Piazza dell\'Industria 5, Milano' },
        ];
        break;
      case 'punti_servizio':
        dataToExport = [
          { id: 'ps001', nome: 'Sede Milano', indirizzo: 'Via Roma 1, Milano', cliente_id: 'cli001' },
          { id: 'ps002', nome: 'Filiale Roma', indirizzo: 'Piazza Italia 10, Roma', cliente_id: 'cli002' },
        ];
        break;
      case 'personale':
        dataToExport = [
          { id: 'per001', nome: 'Mario', cognome: 'Rossi', ruolo: 'Operatore', email: 'mario.rossi@example.com' },
          { id: 'per002', nome: 'Luisa', cognome: 'Bianchi', ruolo: 'Amministrativo', email: 'luisa.bianchi@example.com' },
        ];
        break;
      case 'operatori_network':
        dataToExport = [
          { id: 'opn001', nome: 'Global Security', contatto: 'Giovanni Verdi', telefono: '3331234567' },
          { id: 'opn002', nome: 'SafeGuard Italia', contatto: 'Anna Neri', telefono: '3459876543' },
        ];
        break;
      case 'procedure':
        dataToExport = [
          { id: 'proc001', nome: 'Procedura Standard', descrizione: 'Descrizione della procedura standard.' },
          { id: 'proc002', nome: 'Procedura Emergenza', descrizione: 'Descrizione della procedura di emergenza.' },
        ];
        break;
      case 'tariffe':
        dataToExport = [
          { id: 'tar001', nome: 'Tariffa Oraria Base', costo_orario: 25.50, tipo_servizio: 'PIANTONAMENTO_ARMATO' },
          { id: 'tar002', nome: 'Tariffa Ispezione', costo_ispezione: 50.00, tipo_servizio: 'ISPEZIONI' },
        ];
        break;
      default:
        dataToExport = [{ message: 'Nessun dato di esempio per questo tipo di anagrafica.' }];
    }

    // Crea un nuovo workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, anagraficaType);

    // Genera il buffer Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Imposta gli header per il download del file
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename=${anagraficaType}_export.xlsx`);

    return new NextResponse(excelBuffer, { headers });

  } catch (error) {
    console.error('Errore durante l\'esportazione:', error);
    return NextResponse.json({ error: 'Errore interno del server durante l\'esportazione' }, { status: 500 });
  }
}