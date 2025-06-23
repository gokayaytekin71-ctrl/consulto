// app/api/dilekceler/[filename]/route.js
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export function GET(request, { params }) {
  const { filename } = params;
  const petitionsDir = path.join(process.cwd(), 'veri', 'dilekceler');
  const filePath = path.join(petitionsDir, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: 'Dosya okunamadı.' },
      { status: 500 }
    );
  }
}