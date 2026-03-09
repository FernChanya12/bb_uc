import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล BOQ ทั้งหมด หรือ filter ด้วย query params
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscal = searchParams.get('fiscal');
    const boqName = searchParams.get('boq_name');
    const boqGroup = searchParams.get('boq_group');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    let sql = 'CALL getBoq(?, ?, ?, ?, ?)';
    const params = [
      fiscal || null,
      boqName || null,
      boqGroup || null,
      limit,
      offset,
    ];

    const connection = await dbConfig.getConnection();
    try {
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
      const [results] = await connection.query(sql, params);
      const data = results[0];
      const totalCount = results[1]?.[0]?.totalCount || 0;
      return NextResponse.json({ data, totalCount, page, limit }, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// POST - เพิ่ม BOQ ใหม่
export async function POST(request) {
  try {
    const body = await request.json();
    const uid = body.UID || crypto.randomUUID();

    const sql = `INSERT INTO uc_boq (UID, fiscal, boq_name, boq_detail, boq_group, status, remark, created_by, created_date, updated_by, updated_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`;
    const params = [
      uid,
      body.fiscal || null,
      body.boq_name || null,
      body.boq_detail || null,
      body.boq_group || null,
      body.status || 'T',
      body.remark || null,
      body.created_by || null,
      body.updated_by || null,
    ];

    await dbConfig.query(sql, params);

    const [rows] = await dbConfig.query('SELECT * FROM uc_boq WHERE UID = ?', [uid]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// PUT - แก้ไข BOQ
export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.UID) {
      return NextResponse.json({ message: 'UID is required' }, { status: 400 });
    }

    const sql = `UPDATE uc_boq SET fiscal = ?, boq_name = ?, boq_detail = ?, boq_group = ?, status = ?, remark = ?, updated_by = ?, updated_date = NOW() WHERE UID = ?`;
    const params = [
      body.fiscal || null,
      body.boq_name || null,
      body.boq_detail || null,
      body.boq_group || null,
      body.status || 'T',
      body.remark || null,
      body.updated_by || null,
      body.UID,
    ];

    const [result] = await dbConfig.query(sql, params);
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const [rows] = await dbConfig.query('SELECT * FROM uc_boq WHERE UID = ?', [body.UID]);
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}