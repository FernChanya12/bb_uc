import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'uc_header_202603071353.json');

async function readJsonData() {
  const raw = await fs.readFile(JSON_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeJsonData(data) {
  await fs.writeFile(JSON_PATH, JSON.stringify(data, null, '\t'), 'utf-8');
}

// GET - ดึงข้อมูล header ทั้งหมด หรือ filter ด้วย query params
export async function GET(request) {
  try {
    // DB: const [rows] = await dbConfig.query('SELECT * FROM uc_header WHERE status = ?', ['T']);
    const data = await readJsonData();
    let headers = data.uc_header;

    const { searchParams } = new URL(request.url);
    const headerType = searchParams.get('header_type');
    const uidUplevel = searchParams.get('UID_UPLEVEL');
    const groupCode = searchParams.get('group_code');

    if (headerType) {
      headers = headers.filter(h => h.header_type === headerType);
    }
    if (uidUplevel) {
      headers = headers.filter(h => h.UID_UPLEVEL === uidUplevel);
    }
    if (groupCode) {
      headers = headers.filter(h => h.group_code === groupCode);
    }

    return NextResponse.json(headers, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// POST - เพิ่ม header ใหม่
export async function POST(request) {
  try {
    const body = await request.json();
    // DB: await dbConfig.query('INSERT INTO uc_header (UID, fiscal, header_code, header_name, header_type, UID_UPLEVEL, group_code, status, remark, created_by, created_date, updated_by, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())', [body.UID, body.fiscal, body.header_code, body.header_name, body.header_type, body.UID_UPLEVEL, body.group_code, body.status || 'T', body.remark, body.created_by, body.updated_by]);

    const data = await readJsonData();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newHeader = {
      UID: body.UID || crypto.randomUUID(),
      fiscal: body.fiscal || null,
      header_code: body.header_code || null,
      header_name: body.header_name || null,
      header_type: body.header_type || null,
      UID_UPLEVEL: body.UID_UPLEVEL || null,
      group_code: body.group_code || null,
      status: body.status || 'T',
      remark: body.remark || null,
      created_by: body.created_by || null,
      created_date: now,
      updated_by: body.updated_by || null,
      updated_date: now,
    };

    data.uc_header.push(newHeader);
    await writeJsonData(data);

    return NextResponse.json(newHeader, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// PUT - แก้ไข header
export async function PUT(request) {
  try {
    const body = await request.json();
    // DB: await dbConfig.query('UPDATE uc_header SET header_code = ?, header_name = ?, header_type = ?, UID_UPLEVEL = ?, group_code = ?, status = ?, remark = ?, updated_by = ?, updated_date = NOW() WHERE UID = ?', [body.header_code, body.header_name, body.header_type, body.UID_UPLEVEL, body.group_code, body.status, body.remark, body.updated_by, body.UID]);

    const data = await readJsonData();
    const index = data.uc_header.findIndex(h => h.UID === body.UID);
    if (index === -1) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    data.uc_header[index] = {
      ...data.uc_header[index],
      ...body,
      updated_date: now,
    };
    await writeJsonData(data);

    return NextResponse.json(data.uc_header[index], { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// DELETE - ลบ header (soft delete โดยเปลี่ยน status เป็น F)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('UID');
    // DB: await dbConfig.query('UPDATE uc_header SET status = ?, updated_date = NOW() WHERE UID = ?', ['F', uid]);

    if (!uid) {
      return NextResponse.json({ message: 'UID is required' }, { status: 400 });
    }

    const data = await readJsonData();
    const index = data.uc_header.findIndex(h => h.UID === uid);
    if (index === -1) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    data.uc_header[index].status = 'F';
    data.uc_header[index].updated_date = now;
    await writeJsonData(data);

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}