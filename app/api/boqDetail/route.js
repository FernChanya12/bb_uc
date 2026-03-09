import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึง BOQ tree: uc_boq → boq_header → boq_item
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const boqUid = searchParams.get('boq_uid');

    if (!boqUid) {
      return NextResponse.json({ message: 'boq_uid is required' }, { status: 400 });
    }

    const connection = await dbConfig.getConnection();
    try {
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
      const [results] = await connection.query('CALL getBoqDetail(?)', [boqUid]);

      // result set 0 = uc_boq, 1 = boq_header, 2 = boq_item
      const boqRows = results[0] || [];
      const headers = results[1] || [];
      const items = results[2] || [];

      if (boqRows.length === 0) {
        return NextResponse.json({ message: 'BOQ not found' }, { status: 404 });
      }
      const boq = boqRows[0];

      // จัดกลุ่ม items ตาม boq_header_code
      const itemsByHeader = {};
      for (const item of items) {
        const key = item.boq_header_code;
        if (!itemsByHeader[key]) itemsByHeader[key] = [];
        itemsByHeader[key].push({ ...item, type: 'item' });
      }

      // สร้าง header map
      const headerMap = {};
      for (const h of headers) {
        headerMap[h.UID] = { ...h, type: 'header', items: itemsByHeader[h.UID] || [], children: [] };
      }

      // build tree — แยก root-level vs sub-header
      const rootHeaders = [];
      for (const h of headers) {
        const node = headerMap[h.UID];
        if (h.UID_UPLEVEL && headerMap[h.UID_UPLEVEL]) {
          headerMap[h.UID_UPLEVEL].children.push(node);
        } else {
          rootHeaders.push(node);
        }
      }

      return NextResponse.json({ boq, tree: rootHeaders }, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}