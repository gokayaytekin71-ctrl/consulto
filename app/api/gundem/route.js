import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const title = formData.get('title');
    const linkUrl = formData.get('linkUrl');
    // 1. "content" verisini formdan al
    const content = formData.get('content'); 

    if (!file || !title || !linkUrl || !content) { // content kontrolü eklendi
      return NextResponse.json({ error: 'Eksik bilgi. Tüm alanlar zorunludur.' }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const filepath = path.join(uploadsDir, filename);

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(filepath, buffer);

    // 2. "content" verisini veritabanına kaydet
    const newGundem = await prisma.gundem.create({
      data: {
        title,
        linkUrl,
        imageUrl: `/uploads/${filename}`,
        content, // content alanını buraya ekle
      },
    });

    return NextResponse.json(newGundem);
  } catch (error) {
    console.error("Yükleme hatası:", error);
    return NextResponse.json({ error: 'Dosya yüklenirken bir sorun oluştu.' }, { status: 500 });
  }
}