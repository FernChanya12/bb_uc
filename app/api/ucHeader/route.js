import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล header ทั้งหมด หรือ filter ด้วย query params
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerType = searchParams.get('header_type');
    const headerUplevel = searchParams.get('header_uplevel');
    const groupCode = searchParams.get('group_code');

    let sql = 'SELECT * FROM UC.uc_header WHERE status = ?';
    const params = ['T'];

    if (headerType) {
      sql += ' AND header_type = ?';
      params.push(headerType);
    }
    if (headerUplevel) {
      sql += ' AND header_uplevel = ?';
      params.push(headerUplevel);
    }
    if (groupCode) {
      sql += ' AND group_code = ?';
      params.push(groupCode);
    }

    const connection = await dbConfig.getConnection();
    try {
      const [rows] = await connection.query(sql, params);
      return NextResponse.json(rows, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// POST - เพิ่ม header ใหม่
export async function POST(request) {
  try {
    const body = await request.json();
    const headerId = body.header_id || crypto.randomUUID();

    const sql = `INSERT INTO UC.uc_header (header_id, fiscal, header_code, header_name, header_type, header_uplevel, group_code, cal_id, status, remark, created_by, created_date, updated_by, updated_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATE, ?, SYSDATE)`;
    const params = [
      headerId,
      body.fiscal || null,
      body.header_code || null,
      body.header_name || null,
      body.header_type || null,
      body.header_uplevel || null,
      body.group_code || null,
      body.cal_id || null,
      body.status || 'T',
      body.remark || null,
      body.created_by || null,
      body.updated_by || null,
    ];

    await dbConfig.query(sql, params);

    const [rows] = await dbConfig.query('SELECT * FROM UC.uc_header WHERE header_id = ?', [headerId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// PUT - แก้ไข header
export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.header_id) {
      return NextResponse.json({ message: 'header_id is required' }, { status: 400 });
    }

    const sql = `UPDATE UC.uc_header SET fiscal = ?, header_code = ?, header_name = ?, header_type = ?, header_uplevel = ?, group_code = ?, cal_id = ?, status = ?, remark = ?, updated_by = ?, updated_date = SYSDATE WHERE header_id = ?`;
    const params = [
      body.fiscal || null,
      body.header_code || null,
      body.header_name || null,
      body.header_type || null,
      body.header_uplevel || null,
      body.group_code || null,
      body.cal_id || null,
      body.status || 'T',
      body.remark || null,
      body.updated_by || null,
      body.header_id,
    ];

    const [result] = await dbConfig.query(sql, params);
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const [rows] = await dbConfig.query('SELECT * FROM UC.uc_header WHERE header_id = ?', [body.header_id]);
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// DELETE - ลบ header (soft delete โดยเปลี่ยน status เป็น F)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerId = searchParams.get('header_id');

    if (!headerId) {
      return NextResponse.json({ message: 'header_id is required' }, { status: 400 });
    }

    const [result] = await dbConfig.query(
      'UPDATE UC.uc_header SET status = ?, updated_date = SYSDATE WHERE header_id = ?',
      ['F', headerId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}
