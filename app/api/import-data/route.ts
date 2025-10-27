import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('API /api/import-data POST hit!');
  try {
    const body = await request.json();
    console.log('Received body for import:', body);
    return NextResponse.json({ message: 'Import API hit successfully (simplified).' });
  } catch (error) {
    console.error('Error in simplified import API:', error);
    return NextResponse.json({ error: 'Error processing request in simplified import API.' }, { status: 500 });
  }
}