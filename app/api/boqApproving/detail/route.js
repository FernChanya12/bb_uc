import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'boq_approving.json');

// GET - ดึงข้อมูล BOQ พร้อม boq_header และ boq_item
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const boqUid = searchParams.get('boq_uid');

    // DB:
    // const [boqRows] = await dbConfig.query('CALL getBoqDetail(?)', [boqUid]);

    const raw = await fs.readFile(JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);

    let boqList = data.uc_boq;
    let headerList = data.boq_header;
    let itemList = data.boq_item;

    if (boqUid) {
      boqList = boqList.filter((b) => b.UID === boqUid);
      headerList = headerList.filter((h) => h.UID_PARENT === boqUid);
      const headerUids = new Set(headerList.map((h) => h.UID));
      itemList = itemList.filter((i) => headerUids.has(i.UID_PARENT));
    }

    return NextResponse.json(
      { uc_boq: boqList, boq_header: headerList, boq_item: itemList },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}