import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'boq_approving.json');

export async function POST(request) {
  try {
    const body = await request.json();
    const { boq_uid, report_id, remark, reason, created_by = 'admin' } = body;

    if (!boq_uid || !Array.isArray(boq_uid) || boq_uid.length === 0) {
      return NextResponse.json(
        { message: 'boq_uid must be a non-empty array' },
        { status: 400 }
      );
    }

    const raw = await fs.readFile(JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let updatedCount = 0;
    const logs = [];

    for (const boqId of boq_uid) {

      // 1. เพิ่ม log
      const newLog = {
        UID: 'LOG' + crypto.randomUUID().substring(0, 8).toUpperCase(),
        boq_id: boqId,
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
      logs.push(newLog);

      // 2. หา header ใต้ boq
      const headerUids = new Set(
        data.boq_header
          .filter((h) => h.UID_PARENT === boqId)
          .map((h) => h.UID)
      );

      // 3. update item
      data.boq_item = data.boq_item.map((item) => {
        if (headerUids.has(item.UID_PARENT)) {
          updatedCount++;
          return {
            ...item,
            status: 'A',
            updated_date: now,
            updated_by: created_by,
          };
        }
        return item;
      });
    }

    await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json(
      {
        message: 'Approved successfully',
        logs,
        updatedItems: updatedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Error', error: error.message },
      { status: 500 }
    );
  }
}