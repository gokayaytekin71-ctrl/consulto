// app/payment/redirect/route.js
// Bu dosya, Shopier'den gelen POST'u güvenle alır ve kullanıcıyı GET ile ana sayfaya yönlendirir.

import { NextResponse } from 'next/server';

// Domaininizi buradan alıyoruz
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://consultohukuk.com';

export const dynamic = 'force-dynamic';

// GET isteği gelirse (normal sayfa yüklemesi)
export async function GET(request) {
    // Normal GET'i koru
    return NextResponse.redirect(new URL("/", DOMAIN), 307);
}

// POST isteği gelirse (Shopier'den dönüş)
export async function POST(request) {
    // 303 kodu, tarayıcıya POST'u bırakıp / adresine GET ile gitme talimatı verir.
    // Bu, 405 hatasını çözecektir.
    return NextResponse.redirect(new URL("/", DOMAIN), 303); // <-- KRİTİK DÜZELTME
}
