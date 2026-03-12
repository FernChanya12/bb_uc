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

    let where = `WHERE status = 'D'`;
    const params = [];

    if (fiscal) {
      where += ' AND fiscal = ?';
      params.push(fiscal);
    }
    if (boqName) {
      where += ' AND boq_name LIKE ?';
      params.push(`%${boqName}%`);
    }
    if (boqGroup) {
      where += ' AND boq_group = ?';
      params.push(boqGroup);
    }

    const dataSql = `SELECT boq_id, fiscal, boq_name, boq_detail, boq_group, price, status, remark, created_by, created_date, updated_by, updated_date FROM uc_boq ${where} LIMIT ? OFFSET ?`;
    const countSql = `SELECT COUNT(*) AS totalCount FROM uc_boq ${where}`;

    const connection = await dbConfig.getConnection();
    try {
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
      const [data] = await connection.query(dataSql, [...params, limit, offset]);
      const [countRows] = await connection.query(countSql, params);
      const totalCount = countRows[0]?.totalCount || 0;
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
    const boqId = body.boq_id || crypto.randomUUID();

    const sql = `INSERT INTO uc_boq (boq_id, fiscal, boq_name, boq_detail, boq_group, price, status, remark, created_by, created_date, updated_by, updated_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`;
    const params = [
      boqId,
      body.fiscal || null,
      body.boq_name || null,
      body.boq_detail || null,
      body.boq_group || null,
      body.price || null,
      body.status || 'T',
      body.remark || null,
      body.created_by || null,
      body.updated_by || null,
    ];

    await dbConfig.query(sql, params);

    const [rows] = await dbConfig.query('SELECT * FROM uc_boq WHERE boq_id = ?', [boqId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// PUT - แก้ไข BOQ
export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.boq_id) {
      return NextResponse.json({ message: 'boq_id is required' }, { status: 400 });
    }

    const sql = `UPDATE uc_boq SET fiscal = ?, boq_name = ?, boq_detail = ?, boq_group = ?, price = ?, status = ?, remark = ?, updated_by = ?, updated_date = NOW() WHERE boq_id = ?`;
    const params = [
      body.fiscal || null,
      body.boq_name || null,
      body.boq_detail || null,
      body.boq_group || null,
      body.price || null,
      body.status || 'T',
      body.remark || null,
      body.updated_by || null,
      body.boq_id,
    ];

    const [result] = await dbConfig.query(sql, params);
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const [rows] = await dbConfig.query('SELECT * FROM uc_boq WHERE boq_id = ?', [body.boq_id]);
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// DELETE - ลบ BOQ (soft delete)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const boqId = searchParams.get('boq_id');

    if (!boqId) {
      return NextResponse.json({ message: 'boq_id is required' }, { status: 400 });
    }

    const [result] = await dbConfig.query(
      'UPDATE uc_boq SET status = ?, updated_date = NOW() WHERE boq_id = ?',
      ['F', boqId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}