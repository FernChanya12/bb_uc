import dbConfig from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'public', 'data', 'boq_combined_202603072019.json');

export async function GET(request) {
  try {
    const raw = await fs.readFile(JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const uidParent = searchParams.get('UID_PARENT');
    const searchText = searchParams.get('searchText');

    const validTables = ['uc_group', 'uc_boq', 'boq_header', 'boq_item'];
    
    const targetTable = (table && validTables.includes(table)) ? table : 'uc_group';
    let result = data[targetTable] || [];

    if (uidParent && uidParent !== 'null') {
      result = result.filter(row => String(row.UID_PARENT) === String(uidParent));
    }

    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(row => 
        (row.ITEM_NAME?.toLowerCase().includes(s)) ||
        (row.GROUP_NAME?.toLowerCase().includes(s)) ||
        (row.BOQ_NAME?.toLowerCase().includes(s)) ||
        (row.UID?.toLowerCase().includes(s))
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: error.message }, { status: 500 });
  }
}