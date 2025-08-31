import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DILEKCE_API_URL = process.env.DILEKCE_API_URL || 'http://51.159.28.179:5003';

function isJson(res) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      olay_ozet,
      talep,
      davaci,
      mahkeme,
      eldeki_deliller,
      // opsiyoneller
      dava_turu, konu, talep_kalemleri, vekil, davali, ozel_bilgiler,
    } = body || {};

    if (!olay_ozet || !talep) {
      return NextResponse.json(
        { error: 'Olay özeti ve talep alanları zorunludur.' },
        { status: 400 }
      );
    }

    const deliller = Array.isArray(eldeki_deliller)
      ? eldeki_deliller
      : (typeof eldeki_deliller === 'string' && eldeki_deliller.trim() ? [eldeki_deliller] : []);

    const payload = {
      olay_ozet,
      talep,
      davaci: davaci || {},
      mahkeme: mahkeme || '',
      eldeki_deliller: deliller,
    };
    // opsiyonelleri ekle
    if (dava_turu !== undefined) payload.dava_turu = dava_turu;
    if (konu !== undefined) payload.konu = konu;
    if (talep_kalemleri !== undefined) payload.talep_kalemleri = talep_kalemleri;
    if (vekil !== undefined) payload.vekil = vekil;
    if (davali !== undefined) payload.davali = davali;
    if (ozel_bilgiler !== undefined) payload.ozel_bilgiler = ozel_bilgiler;

    const resp = await fetch(`${DILEKCE_API_URL}/dilekce/olustur`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(400000),
    });

    if (!isJson(resp)) {
      const text = await resp.text();
      return NextResponse.json(
        { error: 'Upstream returned non-JSON', details: text },
        { status: resp.status || 502 },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('API Dilekçe Oluşturma Hatası:', error);
    return NextResponse.json(
      { error: 'Dilekçe oluşturma sırasında bir sunucu hatası oluştu.', detail: String(error?.message || error) },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id parametresi gereklidir.' }, { status: 400 });
    }

    const resp = await fetch(`${DILEKCE_API_URL}/dilekce/durum/${encodeURIComponent(id)}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    });

    if (!isJson(resp)) {
      const text = await resp.text();
      return NextResponse.json(
        { error: 'Upstream returned non-JSON', details: text },
        { status: resp.status || 502 },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('API Dilekçe Durum Hatası:', error);
    return NextResponse.json(
      { error: 'Dilekçe durumu sorgulama sırasında bir sunucu hatası oluştu.', detail: String(error?.message || error) },
      { status: 500 }
    );
  }
}