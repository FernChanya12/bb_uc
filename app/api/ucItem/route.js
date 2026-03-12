import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูล item ทั้งหมด หรือ filter ด้วย query params
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('item_type');
    const headerCode = searchParams.get('header_code');

    let sql = 'SELECT * FROM uc_item WHERE status = ?';
    const params = ['T'];

    if (itemType) {
      sql += ' AND item_type = ?';
      params.push(itemType);
    }
    if (headerCode) {
      sql += ' AND header_code = ?';
      params.push(headerCode);
    }

    const connection = await dbConfig.getConnection();
    try {
      await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
      const [rows] = await connection.query(sql, params);
      return NextResponse.json(rows, { status: 200 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// POST - เพิ่ม item ใหม่
export async function POST(request) {
  try {
    const body = await request.json();
    const itemId = body.item_id || crypto.randomUUID();

    const sql = `INSERT INTO uc_item (item_id, fiscal, item_code, item_name, item_type, id_uplevel, unit_code, header_code, price, status, remark, created_by, created_date, updated_by, updated_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`;
    const params = [
      itemId,
      body.fiscal || null,
      body.item_code || null,
      body.item_name || null,
      body.item_type || null,
      body.id_uplevel || null,
      body.unit_code || null,
      body.header_code || null,
      body.price || null,
      body.status || 'T',
      body.remark || null,
      body.created_by || null,
      body.updated_by || null,
    ];

    await dbConfig.query(sql, params);

    const [rows] = await dbConfig.query('SELECT * FROM uc_item WHERE item_id = ?', [itemId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// PUT - แก้ไข item
export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.item_id) {
      return NextResponse.json({ message: 'item_id is required' }, { status: 400 });
    }

    const sql = `UPDATE uc_item SET fiscal = ?, item_code = ?, item_name = ?, item_type = ?, id_uplevel = ?, unit_code = ?, header_code = ?, price = ?, status = ?, remark = ?, updated_by = ?, updated_date = NOW() WHERE item_id = ?`;
    const params = [
      body.fiscal || null,
      body.item_code || null,
      body.item_name || null,
      body.item_type || null,
      body.id_uplevel || null,
      body.unit_code || null,
      body.header_code || null,
      body.price || null,
      body.status || 'T',
      body.remark || null,
      body.updated_by || null,
      body.item_id,
    ];

    const [result] = await dbConfig.query(sql, params);
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const [rows] = await dbConfig.query('SELECT * FROM uc_item WHERE item_id = ?', [body.item_id]);
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}

// DELETE - ลบ item (soft delete)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json({ message: 'item_id is required' }, { status: 400 });
    }

    const [result] = await dbConfig.query(
      'UPDATE uc_item SET status = ?, updated_date = NOW() WHERE item_id = ?',
      ['F', itemId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}
