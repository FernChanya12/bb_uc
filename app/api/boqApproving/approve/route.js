import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'boq_approving.json');

// POST - อนุมัติ BOQ: เพิ่ม log status A และอัปเดต boq_item status A
export async function POST(request) {
  try {
    const body = await request.json();
    const { boq_uid, report_id, remark, reason, created_by = 'admin' } = body;

    if (!boq_uid) {
      return NextResponse.json({ message: 'boq_uid is required' }, { status: 400 });
    }

    // DB:
    // const conn = await dbConfig.getConnection();
    // await conn.query('SET NAMES utf8mb4 COLLATE utf8mb4_general_ci');
    // await conn.query('CALL approveBoq(?, ?, ?, ?, ?)', [boq_uid, report_id, remark, reason, created_by]);
    // conn.release();

    const raw = await fs.readFile(JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. เพิ่ม boq_approve_log ใหม่ status A
    const newLog = {
      UID: 'LOG' + crypto.randomUUID().substring(0, 8).toUpperCase(),
      boq_id: boq_uid,
      report_id: report_id || null,
      status: 'A',
      reason: reason || null,
      remark: remark || null,
      created_date: now,
      created_by,
      updated_date: now,
      updated_by: created_by,
    };
    data.boq_approve_log.push(newLog);

    // 2. หา header UID ที่อยู่ใต้ boq_uid
    const headerUids = new Set(
      data.boq_header
        .filter((h) => h.UID_PARENT === boq_uid)
        .map((h) => h.UID)
    );

    // 3. อัปเดต boq_item status เป็น A
    let updatedCount = 0;
    data.boq_item = data.boq_item.map((item) => {
      if (headerUids.has(item.UID_PARENT)) {
        updatedCount++;
        return { ...item, status: 'A', updated_date: now, updated_by: created_by };
      }
      return item;
    });

    await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json(
      { message: 'Approved successfully', log: newLog, updatedItems: updatedCount },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}
