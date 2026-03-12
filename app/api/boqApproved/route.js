import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล boqApproved
// Query params:
//   table = uc_group | uc_boq | boq_header | boq_item  (ถ้าไม่ส่งจะคืนทั้งหมด)
//   boq_id = <BOQ ID>  (filter ตาม boq)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const boqId = searchParams.get('boq_id');

    const connection = await dbConfig.getConnection();
    try {
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");

      if (!table) {
        const [groups] = await connection.query('SELECT * FROM uc_group WHERE status = ?', ['T']);
        const [boqs] = await connection.query('SELECT * FROM uc_boq WHERE status = ?', ['T']);
        const [headers] = await connection.query('SELECT * FROM boq_header WHERE status = ?', ['T']);
        const [items] = await connection.query('SELECT * FROM boq_item WHERE status = ?', ['T']);
        return NextResponse.json({ uc_group: groups, uc_boq: boqs, boq_header: headers, boq_item: items }, { status: 200 });
      }

      const validTables = ['uc_group', 'uc_boq', 'boq_header', 'boq_item'];
      if (!validTables.includes(table)) {
        return NextResponse.json({ message: 'Invalid table name' }, { status: 400 });
      }

      let rows;
      if (table === 'boq_header' && boqId) {
        [rows] = await connection.query('SELECT * FROM boq_header WHERE boq_code = ? AND status = ?', [boqId, 'T']);
      } else if (table === 'boq_item' && boqId) {
        [rows] = await connection.query(
          'SELECT bi.* FROM boq_item bi JOIN boq_header bh ON bi.boq_header_code = bh.header_code WHERE bh.boq_code = ? AND bi.status = ?',
          [boqId, 'T']
        );
      } else if (table === 'uc_boq' && boqId) {
        [rows] = await connection.query('SELECT * FROM uc_boq WHERE boq_id = ?', [boqId]);
      } else if (table === 'uc_group') {
        [rows] = await connection.query('SELECT * FROM uc_group WHERE status = ?', ['T']);
      } else {
        [rows] = await connection.query(`SELECT * FROM ${table} WHERE status = ?`, ['T']);
      }

      return NextResponse.json(rows, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}