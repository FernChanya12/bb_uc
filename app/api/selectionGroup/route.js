import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'uc_group_202603071355.json');

// GET - ดึงข้อมูล group สำหรับ dropdown
export async function GET() {
  try {
    // DB: const [rows] = await dbConfig.query('SELECT UID, group_name FROM uc_group WHERE status = ?', ['T']);
    const raw = await fs.readFile(JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data.uc_group, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}
