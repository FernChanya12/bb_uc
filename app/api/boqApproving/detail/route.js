import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล BOQ พร้อม boq_header และ boq_item
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const boqId = searchParams.get('boq_id');

    const connection = await dbConfig.getConnection();
    try {

      let boqList, headerList, itemList;

      if (boqId) {
        [boqList] = await connection.query('SELECT * FROM UC.uc_boq WHERE boq_id = ?', [boqId]);
        [headerList] = await connection.query('SELECT * FROM UC.boq_header WHERE boq_code = ?', [boqId]);

        if (headerList.length > 0) {
          const headerCodes = headerList.map((h) => h.header_code);
          [itemList] = await connection.query(
            'SELECT * FROM UC.boq_item WHERE boq_header_code IN (?)',
            [headerCodes]
          );
        } else {
          itemList = [];
        }
      } else {
        [boqList] = await connection.query('SELECT * FROM UC.uc_boq');
        [headerList] = await connection.query('SELECT * FROM UC.boq_header');
        [itemList] = await connection.query('SELECT * FROM UC.boq_item');
      }

      return NextResponse.json(
        { uc_boq: boqList, boq_header: headerList, boq_item: itemList },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}