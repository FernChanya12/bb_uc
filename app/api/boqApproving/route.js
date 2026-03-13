import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล BOQ ที่รอการอนุมัติ
export async function GET() {
  try {
    const connection = await dbConfig.getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM UC.uc_boq WHERE status != ?', ['F']);
      return NextResponse.json(rows, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}