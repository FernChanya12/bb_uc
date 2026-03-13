import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล group สำหรับ dropdown
export async function GET() {
  try {
    const connection = await dbConfig.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT group_id, group_code, group_name FROM UC.uc_group WHERE status = ?',
        ['T']
      );
      return NextResponse.json(rows, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}
