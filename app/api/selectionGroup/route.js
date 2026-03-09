import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';


// GET - ดึงข้อมูล group สำหรับ dropdown
export async function GET() {
  try {
    const connection = await dbConfig.getConnection();
    try {
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
      const [results] = await connection.query('CALL selectionGroup()');
      const data = results[0] || [];
      return NextResponse.json(data, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}
