import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'uc_item_202603071355.json');

async function readJsonData() {
  const raw = await fs.readFile(JSON_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeJsonData(data) {
  await fs.writeFile(JSON_PATH, JSON.stringify(data, null, '\t'), 'utf-8');
}

// GET - ดึงข้อมูล item ทั้งหมด หรือ filter ด้วย query params
export async function GET(request) {
  try {
    // DB: const [rows] = await dbConfig.query('SELECT * FROM uc_item WHERE status = ?', ['T']);
    const data = await readJsonData();
    let items = data.uc_item;

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('item_type');
    const groupCode = searchParams.get('group_code');

    if (itemType) {
      items = items.filter(i => i.item_type === itemType);
    }
    if (groupCode) {
      items = items.filter(i => i.group_code === groupCode);
    }

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// POST - เพิ่ม item ใหม่
export async function POST(request) {
  try {
    const body = await request.json();
    // DB: await dbConfig.query('INSERT INTO uc_item (UID, fiscal, item_code, item_name, item_type, UID_UPLEVEL, unit_code, group_code, price, status, remark, created_by, created_date, updated_by, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())', [body.UID, body.fiscal, body.item_code, body.item_name, body.item_type, body.UID_UPLEVEL, body.unit_code, body.group_code, body.price, body.status || 'T', body.remark, body.created_by, body.updated_by]);

    const data = await readJsonData();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newItem = {
      UID: body.UID || crypto.randomUUID(),
      fiscal: body.fiscal || null,
      item_code: body.item_code || null,
      item_name: body.item_name || null,
      item_type: body.item_type || null,
      UID_UPLEVEL: body.UID_UPLEVEL || null,
      unit_code: body.unit_code || null,
      group_code: body.group_code || null,
      price: body.price || null,
      status: body.status || 'T',
      remark: body.remark || null,
      created_by: body.created_by || null,
      created_date: now,
      updated_by: body.updated_by || null,
      updated_date: now,
    };

    data.uc_item.push(newItem);
    await writeJsonData(data);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// PUT - แก้ไข item
export async function PUT(request) {
  try {
    const body = await request.json();
    // DB: await dbConfig.query('UPDATE uc_item SET item_code = ?, item_name = ?, item_type = ?, UID_UPLEVEL = ?, unit_code = ?, group_code = ?, price = ?, status = ?, remark = ?, updated_by = ?, updated_date = NOW() WHERE UID = ?', [body.item_code, body.item_name, body.item_type, body.UID_UPLEVEL, body.unit_code, body.group_code, body.price, body.status, body.remark, body.updated_by, body.UID]);

    const data = await readJsonData();
    const index = data.uc_item.findIndex(i => i.UID === body.UID);
    if (index === -1) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    data.uc_item[index] = {
      ...data.uc_item[index],
      ...body,
      updated_date: now,
    };
    await writeJsonData(data);

    return NextResponse.json(data.uc_item[index], { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// DELETE - ลบ item (soft delete)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('UID');
    // DB: await dbConfig.query('UPDATE uc_item SET status = ?, updated_date = NOW() WHERE UID = ?', ['F', uid]);

    if (!uid) {
      return NextResponse.json({ message: 'UID is required' }, { status: 400 });
    }

    const data = await readJsonData();
    const index = data.uc_item.findIndex(i => i.UID === uid);
    if (index === -1) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    data.uc_item[index].status = 'F';
    data.uc_item[index].updated_date = now;
    await writeJsonData(data);

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}