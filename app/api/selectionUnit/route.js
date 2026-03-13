import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล unit สำหรับ dropdown
export async function GET() {
  try {
    const connection = await dbConfig.getConnection();
    try {
      const [rows] = await connection.query('SELECT unit_id, unit_code, unit_name FROM UC.uc_unit');
      return NextResponse.json(rows, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}
