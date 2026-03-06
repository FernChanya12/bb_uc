import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// Get all items
export async function GET() {
  try {
    const [users] = await dbConfig.query('SELECT UID, item_name FROM uc_item');
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Database Error', error: error.message }, { status: 500 });
  }
}