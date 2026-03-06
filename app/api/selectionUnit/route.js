import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// Get all units
export async function GET() {
  try {
    const [users] = await dbConfig.query('SELECT UID, unit_name FROM uc_unit');
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Database Error', error: error.message }, { status: 500 });
  }
}