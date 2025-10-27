import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/export-data GET hit!');
  try {
    const { searchParams } = new URL(request.url);
    const anagraficaType = searchParams.get('type');
    console.log('Received type for export:', anagraficaType);
    return NextResponse.json({ message: `Export API hit successfully for type: ${anagraficaType} (simplified).` });
  } catch (error) {
    console.error('Error in simplified export API:', error);
    return NextResponse.json({ error: 'Error processing request in simplified export API.' }, { status: 500 });
  }
}