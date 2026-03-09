import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'boq_combined_202603072019.json');

// GET - ดึงข้อมูล boqApproved
// Query params:
//   table = uc_group | uc_boq | boq_header | boq_item  (ถ้าไม่ส่งจะคืนทั้งหมด)
//   UID_PARENT = <parent UID>  (filter ตาม parent)
//   UID_UPLEVEL = <uplevel UID> (filter ตาม uplevel ภายใน table เดียวกัน)
export async function GET(request) {
  try {
    const raw = await fs.readFile(JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const uidParent = searchParams.get('UID_PARENT');

    // ถ้าไม่ระบุ table → ค้นหาจากทุก table
    if (!table) {
      if (uidParent) {
        const allTables = ['uc_group', 'uc_boq', 'boq_header', 'boq_item'];
        const result = {};
        for (const t of allTables) {
          const filtered = (data[t] || []).filter(row => row.UID_PARENT === uidParent);
          if (filtered.length > 0) result[t] = filtered;
        }
        return NextResponse.json(result, { status: 200 });
      }
      return NextResponse.json(data, { status: 200 });
    }

    // ตรวจสอบชื่อ table ที่ถูกต้อง
    const validTables = ['uc_group', 'uc_boq', 'boq_header', 'boq_item'];
    if (!validTables.includes(table)) {
      return NextResponse.json({ message: 'Invalid table name' }, { status: 400 });
    }

    let result = data[table] || [];

    if (uidParent) {
      result = result.filter(row => row.UID_PARENT === uidParent);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}