// app/api/dilekceler/[...slug]/route.js
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export function GET(request, { params }) {
  // params.slug: ['Asliye Hukuk Davaları', '0009547 - … .txt']
  const slugArray = params.slug;
  const petitionsDir = path.join(process.cwd(), 'veri', 'dilekceler');
  const filePath = path.join(petitionsDir, ...slugArray);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch (err) {
    console.error('Dosya okunamadı', filePath, err);
    return NextResponse.json({ error: 'Dosya okunamadı.' }, { status: 500 });
  }
}