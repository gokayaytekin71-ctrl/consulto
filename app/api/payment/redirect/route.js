// app/payment/redirect/route.js
// Bu dosya, Shopier'den gelen POST'u güvenle alır ve kullanıcıyı GET ile ana sayfaya yönlendirir.

import { NextResponse } from 'next/server';

// Domaininizi buradan alıyoruz
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://www.consultohukuk.com';

export const dynamic = 'force-dynamic';

// GET isteği gelirse (normal sayfa yüklemesi)
export async function GET(request) {
    // Genellikle bu kısım çalışmaz, ama çalışırsa ana sayfaya at
    return NextResponse.redirect(new URL('/', DOMAIN), 307);
}

// POST isteği gelirse (Shopier'den dönüş)
export async function POST(request) {
    // 1. Gelen POST verilerini ignore et (artık gerek yok)
    // 2. Tarayıcıya "Şimdi / adresine git" (GET isteğiyle) talimatı ver
    
    // 303 See Other, POST isteğini GET'e çevirip yeni konuma gitmek için idealdir.
    return NextResponse.redirect(new URL('/', DOMAIN), 303);
}