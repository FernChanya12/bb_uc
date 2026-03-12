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
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
      await connection.beginTransaction();

      const boqLogId = crypto.randomUUID();

      // 1. Insert approve log status I
      await connection.query(
        `INSERT INTO boq_approve_log (boq_log_id, boq_id, report_id, status, reason, remark, created_date, created_by, updated_date, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
        [boqLogId, boq_id, report_id || null, 'I', reason, remark || null, created_by, created_by]
      );

      // 2. อัปเดต boq_item status = 'I' ผ่าน boq_header
      const [result] = await connection.query(
        `UPDATE boq_item bi
         JOIN boq_header bh ON bi.boq_header_code = bh.header_code
         SET bi.status = ?, bi.updated_date = NOW(), bi.updated_by = ?
         WHERE bh.boq_code = ?`,
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