"use client";

import { supabase } from "@/integrations/supabase/client";

export async function testOperatoriNetworkNoteColumn() {
  try {
    // Test 1: Try to select the note column specifically
    const { data, error } = await supabase
      .from('operatori_network')
      .select('id, nome, cognome, note')
      .limit(1);
    
    if (error) {
      console.error('[test-schema-cache] Error selecting note column:', error);
      
      if (error.code === 'PGRST204' || error.message.includes('column "note" does not exist')) {
        return { 
          success: false, 
          error: "Cache postgREST non aggiornata: la colonna 'note' non è ancora visibile all'API.",
          code: error.code
        };
      }
      
      return { success: false, error: error.message, code: error.code };
    }
    
    console.log('[test-schema-cache] Successfully selected note column:', data);
    return { success: true, data };
    
  } catch (err) {
    console.error('[test-schema-cache] Unexpected error:', err);
    return { success: false, error: (err as Error).message };
  }
}

export async function testInsertOperatoriNetworkWithNote() {
  try {
    const testData = {
      nome: 'Test',
      cognome: 'Schema',
      email: `test-${Date.now()}@example.com`,
      note: 'Test note for schema cache validation'
    };
    
    const { data, error } = await supabase
      .from('operatori_network')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('[test-schema-cache] Error inserting with note:', error);
      
      if (error.code === 'PGRST204' || error.message.includes('column "note" does not exist')) {
        return { 
          success: false, 
          error: "Impossibile inserire: la colonna 'note' non è riconosciuta dalla cache dello schema.",
          code: error.code
        };
      }
      
      return { success: false, error: error.message, code: error.code };
    }
    
    // Clean up test record
    if (data?.id) {
      await supabase
        .from('operatori_network')
        .delete()
        .eq('id', data.id);
    }
    
    console.log('[test-schema-cache] Successfully inserted and cleaned up record with note:', data);
    return { success: true, data };
    
  } catch (err) {
    console.error('[test-schema-cache] Unexpected error during insert test:', err);
    return { success: false, error: (err as Error).message };
  }
}