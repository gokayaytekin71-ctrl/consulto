import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { consumeQuota } from "@/lib/quota";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DILEKCE_API_URL = process.env.DILEKCE_API_URL || 'http://51.159.28.179:5003';

function isJson(res) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

function normalizePerson(v) {
  if (typeof v === 'string') {
    const s = v.trim();
    return s ? { ad_soyad: s } : undefined;
  }
  if (v && typeof v === 'object') {
    // Allow already-shaped objects like { ad_soyad, tc, vekil_mi, ... }
    return Object.keys(v).length ? v : undefined;
  }
  return undefined;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED_DILEKCE", message: "Dilekçe oluşturmak için giriş yapmanız gereklidir!", requireLogin: true, type: "dilekce" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    // Atomic kota kontrolü + tüketim
    const qc = await consumeQuota(userId, "dilekce");
    if (!qc.ok) {
      return NextResponse.json(
        {
          error: "QUOTA_EXCEEDED",
          message: "Haftalık dilekçe kotanız doldu.",
          type: "dilekce",
          remaining: qc.remaining,
          limit: qc.limit,
          plan: qc.planCode,
          weekKey: qc.weekKey,
        },
        { status: 402 }
      );
    }

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

    const davaciNorm = normalizePerson(davaci);
    const davaliNorm = normalizePerson(davali);
    const vekilNorm  = normalizePerson(vekil);

    const payload = {
      olay_ozet,
      talep,
      mahkeme: mahkeme || '',
      eldeki_deliller: deliller,
    };

    if (davaciNorm) payload.davaci = davaciNorm;
    if (davaliNorm) payload.davali = davaliNorm;

    // opsiyonelleri ekle
    if (dava_turu !== undefined) payload.dava_turu = dava_turu;
    if (konu !== undefined) payload.konu = konu;
    if (talep_kalemleri !== undefined) payload.talep_kalemleri = talep_kalemleri;
    if (vekilNorm) payload.vekil = vekilNorm;
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
        { error: 'UPSTREAM_NOT_JSON', message: 'Dilekçe servisi beklenmeyen bir yanıt döndürdü.', preview: String(text || '').slice(0, 180) },
        { status: resp.status || 502 },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('API Dilekçe Oluşturma Hatası:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Dilekçe oluşturma sırasında bir hata oluştu.', detailPreview: String(error?.message || error).slice(0, 180) },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED_DILEKCE', message: 'Dilekçe durumu görüntülemek için giriş yapmanız gereklidir!', requireLogin: true, type: 'dilekce' },
        { status: 401 }
      );
    }
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
        { error: 'UPSTREAM_NOT_JSON', message: 'Dilekçe servisi beklenmeyen bir yanıt döndürdü.', preview: String(text || '').slice(0, 180) },
        { status: resp.status || 502 },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('API Dilekçe Durum Hatası:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Dilekçe durumu sorgulama sırasında bir hata oluştu.', detailPreview: String(error?.message || error).slice(0, 180) },
      { status: 500 }
    );
  }
}