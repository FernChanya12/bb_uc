import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// POST - ไม่อนุมัติ BOQ: เพิ่ม log status I และอัปเดต boq_item status I
export async function POST(request) {
  try {
    const body = await request.json();
    const { boq_id, report_id, remark, reason, created_by = 'admin' } = body;

    if (!boq_id) {
      return NextResponse.json({ message: 'boq_id is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json(
        { message: 'reason is required for inapprove' },
        { status: 400 }
      );
    }

    const connection = await dbConfig.getConnection();
    try {
      await connection.beginTransaction();

      const boqLogId = crypto.randomUUID();

      // 1. Insert approve log status I
      await connection.query(
        `INSERT INTO UC.boq_approve_log (boq_log_id, boq_id, report_id, status, reason, remark, created_date, created_by, updated_date, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, SYSDATE, ?, SYSDATE, ?)`,
        [boqLogId, boq_id, report_id || null, 'I', reason, remark || null, created_by, created_by]
      );

      // 2. อัปเดต boq_item status = 'I' ผ่าน boq_header
      const [result] = await connection.query(
        `UPDATE UC.boq_item
         SET status = ?, updated_date = SYSDATE, updated_by = ?
         WHERE boq_header_code IN (SELECT header_code FROM UC.boq_header WHERE boq_code = ?)`,
        ['I', created_by, boq_id]
      );

      await connection.commit();

      return NextResponse.json(
        { message: 'Inapproved successfully', boq_log_id: boqLogId, updatedItems: result.affectedRows },
        { status: 200 }
      );
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Error', error: error.message },
      { status: 500 }
    );
  }
}