// @ts-nocheck
import { getFieldValue, toString, toNumber, toBoolean, toDateString, isValidUuid } from './utils.ts';

// Mapper per i dati dei Clienti
function mapClientData(rowData: any) {
  const ragione_sociale = getFieldValue(rowData, ['Ragione Sociale', 'ragione_sociale', 'ragioneSociale'], toString);
  if (!ragione_sociale) {
    throw new Error('Ragione Sociale is required and cannot be empty.');
  }

  return {
    ragione_sociale: ragione_sociale,
    codice_fiscale: getFieldValue(rowData, ['Codice Fiscale', 'codice_fiscale', 'codiceFiscale'], toString),
    partita_iva: getFieldValue(rowData, ['Partita IVA', 'partita_iva', 'partitaIva'], toString),
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    pec: getFieldValue(rowData, ['PEC', 'pec'], toString),
    sdi: getFieldValue(rowData, ['SDI', 'sdi'], toString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
    codice_cliente_custom: getFieldValue(rowData, ['Codice Cliente Manuale', 'codice_cliente_custom', 'codiceClienteCustom'], toString),
  };
}

// Mapper per i dati dei Punti Servizio
async function mapPuntoServizioData(rowData: any, supabaseAdmin: any) {
  const nome_punto_servizio = getFieldValue(rowData, ['Nome Punto Servizio', 'nome_punto_servizio', 'nomePuntoServizio'], toString);
  if (!nome_punto_servizio) {
    throw new Error('Nome Punto Servizio is required and cannot be empty.');
  }

  let id_cliente = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  if (id_cliente && !isValidUuid(id_cliente)) {
    id_cliente = null;
  }

  // Lookup client by codice_cliente_custom if id_cliente is not provided
  if (!id_cliente) {
    const codice_cliente_custom = getFieldValue(rowData, ['Codice Cliente Manuale', 'codice_cliente_custom', 'codiceClienteCustom'], toString);
    if (codice_cliente_custom) {
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clienti')
        .select('id')
        .eq('codice_cliente_custom', codice_cliente_custom)
        .single();
      if (clientError || !clientData) {
        throw new Error(`Cliente con Codice Cliente Manuale '${codice_cliente_custom}' non trovato.`);
      }
      id_cliente = clientData.id;
    }
  }

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  if (fornitore_id && !isValidUuid(fornitore_id)) {
    fornitore_id = null;
  }

  // Lookup fornitore by codice_cliente_associato (manual supplier code) if fornitore_id is not provided
  if (!fornitore_id) {
    const codice_fornitore_manuale = getFieldValue(rowData, ['Codice Fornitore Manuale', 'codice_fornitore_manuale', 'codiceFornitoreManuale'], toString);
    if (codice_fornitore_manuale) {
      const { data: fornitoreData, error: fornitoreError } = await supabaseAdmin
        .from('fornitori')
        .select('id')
        .eq('codice_cliente_associato', codice_fornitore_manuale) // Assuming this is the manual code for suppliers
        .single();
      if (fornitoreError || !fornitoreData) {
        throw new Error(`Fornitore con Codice Fornitore Manuale '${codice_fornitore_manuale}' non trovato.`);
      }
      fornitore_id = fornitoreData.id;
    }
  }

  let latitude = getFieldValue(rowData, ['Latitudine', 'latitude'], toNumber);
  let longitude = getFieldValue(rowData, ['Longitudine', 'longitude'], toNumber);

  let note = getFieldValue(rowData, ['Note', 'note'], toString);

  if (latitude === null && longitude === null) {
    const potentialShiftedLat = toNumber(rowData['Note'] || rowData['note']);
    const potentialShiftedLon = toNumber(rowData['fornitore_id'] || rowData['fornitoreId']);

    if (potentialShiftedLat !== null && potentialShiftedLon !== null && Math.abs(potentialShiftedLat) <= 90 && Math.abs(potentialShiftedLon) <= 180) {
      latitude = potentialShiftedLat;
      longitude = potentialShiftedLon;
      note = null;
    }
  }

  return {
    nome_punto_servizio: nome_punto_servizio,
    id_cliente: id_cliente,
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    referente: getFieldValue(rowData, ['Referente', 'referente'], toString),
    telefono_referente: getFieldValue(rowData, ['Telefono Referente', 'telefono_referente', 'telefonoReferente'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    note: note,
    tempo_intervento: getFieldValue(rowData, ['Tempo Intervento', 'tempo_intervento', 'tempoIntervento'], toString),
    fornitore_id: fornitore_id,
    codice_cliente: getFieldValue(rowData, ['Codice Cliente', 'codice_cliente', 'codiceCliente'], toString),
    codice_sicep: getFieldValue(rowData, ['Codice SICEP', 'codice_sicep', 'codiceSicep'], toString),
    codice_fatturazione: getFieldValue(rowData, ['Codice Fatturazione', 'codice_fatturazione', 'codiceFatturazione'], toString),
    latitude: latitude,
    longitude: longitude,
    nome_procedura: getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString),
  };
}

// Mapper per i dati dei Fornitori
function mapFornitoreData(rowData: any) {
  const ragione_sociale = getFieldValue(rowData, ['Ragione Sociale', 'ragione_sociale', 'ragioneSociale'], toString);
  if (!ragione_sociale) {
    throw new Error('Ragione Sociale is required and cannot be empty.');
  }

  return {
    ragione_sociale: ragione_sociale,
    codice_fiscale: getFieldValue(rowData, ['Codice Fiscale', 'codice_fiscale', 'codiceFiscale'], toString),
    partita_iva: getFieldValue(rowData, ['Partita IVA', 'partita_iva', 'partitaIva'], toString),
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    pec: getFieldValue(rowData, ['PEC', 'pec'], toString),
    tipo_servizio: getFieldValue(rowData, ['Tipo Servizio', 'tipo_servizio', 'tipoServizio'], toString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
    codice_cliente_associato: getFieldValue(rowData, ['Codice Fornitore Manuale', 'codice_cliente_associato', 'codiceClienteAssociato'], toString),
  };
}

// Mapper per i dati del Personale
function mapPersonaleData(rowData: any) {
  const nome = getFieldValue(rowData, ['Nome', 'nome'], toString);
  const cognome = getFieldValue(rowData, ['Cognome', 'cognome'], toString);
  if (!nome || !cognome) {
    throw new Error('Nome and Cognome are required and cannot be empty.');
  }

  return {
    nome: nome,
    cognome: cognome,
    codice_fiscale: getFieldValue(rowData, ['Codice Fiscale', 'codice_fiscale', 'codiceFiscale'], toString),
    ruolo: getFieldValue(rowData, ['Ruolo', 'ruolo'], toString),
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    data_nascita: getFieldValue(rowData, ['Data Nascita', 'data_nascita', 'dataNascita', 'Data Nascita (YYYY-MM-DD)'], toDateString),
    luogo_nascita: getFieldValue(rowData, ['Luogo Nascita', 'luogo_nascita', 'luogoNascita'], toString),
    indirizzo: getFieldValue(rowData, ['Indirizzo', 'indirizzo'], toString),
    cap: getFieldValue(rowData, ['CAP', 'cap'], toString),
    citta: getFieldValue(rowData, ['Città', 'citta'], toString),
    provincia: getFieldValue(rowData, ['Provincia', 'provincia'], toString),
    data_assunzione: getFieldValue(rowData, ['Data Assunzione', 'data_assunzione', 'dataAssunzione', 'Data Assunzione (YYYY-MM-DD)'], toDateString),
    data_cessazione: getFieldValue(rowData, ['Data Cessazione', 'data_cessazione', 'dataCessazione', 'Data Cessazione (YYYY-MM-DD)'], toDateString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Mapper per i dati degli Operatori Network
function mapOperatoreNetworkData(rowData: any) {
  const nome = getFieldValue(rowData, ['Nome', 'nome'], toString);
  const cognome = getFieldValue(rowData, ['Cognome', 'cognome'], toString);
  if (!nome || !cognome) {
    throw new Error('Nome and Cognome are required and cannot be empty.');
  }

  let cliente_id = getFieldValue(rowData, ['ID Cliente', 'id_cliente', 'idCliente', 'ID Cliente (UUID)'], toString);
  cliente_id = (cliente_id && isValidUuid(cliente_id)) ? cliente_id : null;

  return {
    nome: nome,
    cognome: cognome,
    cliente_id: cliente_id,
    telefono: getFieldValue(rowData, ['Telefono', 'telefono'], toString),
    email: getFieldValue(rowData, ['Email', 'email'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Mapper per i dati delle Procedure
function mapProceduraData(rowData: any) {
  const nome_procedura = getFieldValue(rowData, ['Nome Procedura', 'nome_procedura', 'nomeProcedura'], toString);
  if (!nome_procedura) {
    throw new Error('Nome Procedura is required and cannot be empty.');
  }

  return {
    nome_procedura: nome_procedura,
    descrizione: getFieldValue(rowData, ['Descrizione', 'descrizione'], toString),
    versione: getFieldValue(rowData, ['Versione', 'versione'], toString),
    data_ultima_revisione: getFieldValue(rowData, ['Data Ultima Revisione', 'data_ultima_revisione', 'dataUltimaRevisione', 'Data Ultima Revisione (YYYY-MM-DD)'], toDateString),
    responsabile: getFieldValue(rowData, ['Responsabile', 'responsabile'], toString),
    documento_url: getFieldValue(rowData, ['URL Documento', 'documento_url', 'documentoUrl'], toString),
    attivo: getFieldValue(rowData, ['Attivo', 'attivo', 'Attivo (TRUE/FALSE)'], toBoolean),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Mapper per i dati delle Tariffe
function mapTariffaData(rowData: any) {
  const tipo_servizio = getFieldValue(rowData, ['Tipo Servizio', 'tipo_servizio', 'tipoServizio'], toString);
  const importo = getFieldValue(rowData, ['Importo', 'importo'], toNumber);
  if (!tipo_servizio || importo === null) {
    throw new Error('Tipo Servizio and Importo are required.');
  }

  let client_id = getFieldValue(rowData, ['ID Cliente', 'client_id', 'clientId', 'ID Cliente (UUID)'], toString);
  client_id = (client_id && isValidUuid(client_id)) ? client_id : null;

  let punto_servizio_id = getFieldValue(rowData, ['ID Punto Servizio', 'punto_servizio_id', 'puntoServizioId', 'ID Punto Servizio (UUID)'], toString);
  punto_servizio_id = (punto_servizio_id && isValidUuid(punto_servizio_id)) ? punto_servizio_id : null;

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;

  return {
    client_id: client_id,
    tipo_servizio: tipo_servizio,
    importo: importo,
    supplier_rate: getFieldValue(rowData, ['Costo Fornitore', 'supplier_rate', 'supplierRate'], toNumber),
    unita_misura: getFieldValue(rowData, ['Unità di Misura', 'unita_misura', 'unitaMisura'], toString),
    punto_servizio_id: punto_servizio_id,
    fornitore_id: fornitore_id,
    data_inizio_validita: getFieldValue(rowData, ['Data Inizio Validità', 'data_inizio_validita', 'dataInizioValidita', 'Data Inizio Validità (YYYY-MM-DD)'], toDateString),
    data_fine_validita: getFieldValue(rowData, ['Data Fine Validità', 'data_fine_validita', 'dataFineValidita', 'Data Fine Validità (YYYY-MM-DD)'], toDateString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Mapper per i dati della Rubrica Punti Servizio
function mapRubricaPuntiServizioData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let punto_servizio_id = getFieldValue(rowData, ['ID Punto Servizio', 'punto_servizio_id', 'puntoServizioId', 'ID Punto Servizio (UUID)'], toString);
  punto_servizio_id = (punto_servizio_id && isValidUuid(punto_servizio_id)) ? punto_servizio_id : null;
  if (!punto_servizio_id) {
    throw new Error('ID Punto Servizio is required and must be a valid UUID.');
  }

  return {
    punto_servizio_id: punto_servizio_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Mapper per i dati della Rubrica Clienti
function mapRubricaClientiData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let client_id = getFieldValue(rowData, ['ID Cliente', 'client_id', 'clientId', 'ID Cliente (UUID)'], toString);
  client_id = (client_id && isValidUuid(client_id)) ? client_id : null;
  if (!client_id) {
    throw new Error('ID Cliente is required and must be a valid UUID.');
  }

  return {
    client_id: client_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

// Mapper per i dati della Rubrica Fornitori
function mapRubricaFornitoriData(rowData: any) {
  const tipo_recapito = getFieldValue(rowData, ['Tipo Recapito', 'tipo_recapito', 'tipoRecapito'], toString);
  if (!tipo_recapito) {
    throw new Error('Tipo Recapito is required and cannot be empty.');
  }

  let fornitore_id = getFieldValue(rowData, ['ID Fornitore', 'fornitore_id', 'fornitoreId', 'ID Fornitore (UUID)'], toString);
  fornitore_id = (fornitore_id && isValidUuid(fornitore_id)) ? fornitore_id : null;
  if (!fornitore_id) {
    throw new Error('ID Fornitore is required and must be a valid UUID.');
  }

  return {
    fornitore_id: fornitore_id,
    tipo_recapito: tipo_recapito,
    nome_persona: getFieldValue(rowData, ['Nome Persona', 'nome_persona', 'nomePersona'], toString),
    telefono_fisso: getFieldValue(rowData, ['Telefono Fisso', 'telefono_fisso', 'telefonoFisso'], toString),
    telefono_cellulare: getFieldValue(rowData, ['Telefono Cellulare', 'telefono_cellulare', 'telefonoCellulare'], toString),
    email_recapito: getFieldValue(rowData, ['Email Recapito', 'email_recapito', 'emailRecapito'], toString),
    note: getFieldValue(rowData, ['Note', 'note'], toString),
  };
}

export const dataMappers: { [key: string]: (rowData: any, supabaseAdmin: any) => Promise<any> | any } = {
  clienti: mapClientData,
  punti_servizio: mapPuntoServizioData,
  fornitori: mapFornitoreData,
  personale: mapPersonaleData,
  operatori_network: mapOperatoreNetworkData,
  procedure: mapProceduraData,
  tariffe: mapTariffaData,
  rubrica_punti_servizio: mapRubricaPuntiServizioData,
  rubrica_clienti: mapRubricaClientiData,
  rubrica_fornitori: mapRubricaFornitoriData,
};