import { NextResponse } from 'next/server';

// GET - ดึงรายการ status สำหรับ dropdown
export async function GET() {
  const statuses = [
    { status_code: 'T', status_name: 'Active' },
    { status_code: 'F', status_name: 'Inactive' },
    { status_code: 'P', status_name: 'Pending' },
    { status_code: 'A', status_name: 'Approved' },
    { status_code: 'I', status_name: 'Not Approved' },
    { status_code: 'R', status_name: 'Returned' },
  ];
  return NextResponse.json(statuses, { status: 200 });
}
