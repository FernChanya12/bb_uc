import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึง BOQ tree: uc_boq → boq_header → boq_item
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const boqId = searchParams.get('boq_id');

    if (!boqId) {
      return NextResponse.json({ message: 'boq_id is required' }, { status: 400 });
    }

    const connection = await dbConfig.getConnection();
    try {

      // result set 1: ข้อมูล BOQ (root)
      const [boqRows] = await connection.query(
        'SELECT boq_id, fiscal, boq_name, boq_detail, boq_group, status, remark FROM UC.uc_boq WHERE boq_id = ?',
        [boqId]
      );

      if (boqRows.length === 0) {
        return NextResponse.json({ message: 'BOQ not found' }, { status: 404 });
      }
      const boq = boqRows[0];

      // result set 2: header ทั้งหมดภายใต้ boq นี้
      const [headers] = await connection.query(
        'SELECT boq_header_id, fiscal, header_code, boq_code, header_uplevel, status, remark, created_by, created_date, updated_by, updated_date FROM UC.boq_header WHERE boq_code = ?',
        [boqId]
      );

      // result set 3: item ทั้งหมดที่อยู่ภายใต้ headers ของ boq นี้
      const [items] = await connection.query(
        `SELECT bi.boq_item_id, bi.fiscal, bi.boq_header_code, bi.item_code, bi.item_uplevel,
                bi.price, bi.status, bi.remark,
                bi.created_by, bi.created_date, bi.updated_by, bi.updated_date
         FROM UC.boq_item bi
         INNER JOIN UC.boq_header bh ON bi.boq_header_code = bh.boq_header_id
         WHERE bh.boq_code = ?`,
        [boqId]
      );

      // จัดกลุ่ม items ตาม boq_header_code (references boq_header.boq_header_id)
      const itemsByHeader = {};
      for (const item of items) {
        const key = item.boq_header_code;
        if (!itemsByHeader[key]) itemsByHeader[key] = [];
        itemsByHeader[key].push({ ...item, type: 'item' });
      }

      // สร้าง header map โดยใช้ boq_header_id เป็น key
      const headerMap = {};
      for (const h of headers) {
        headerMap[h.boq_header_id] = { ...h, type: 'header', items: itemsByHeader[h.boq_header_id] || [], children: [] };
      }

      // build tree — แยก root-level vs sub-header (header_uplevel references parent boq_header_id)
      const rootHeaders = [];
      for (const h of headers) {
        const node = headerMap[h.boq_header_id];
        if (h.header_uplevel && headerMap[h.header_uplevel]) {
          headerMap[h.header_uplevel].children.push(node);
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