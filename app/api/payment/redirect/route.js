// app/payment/redirect/route.js
// Bu dosya, POST veya GET ne gelirse gelsin tarayıcıyı ana sayfaya yönlendirir.

import { NextResponse } from 'next/server';

// Domaininizi buradan alıyoruz
const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://www.consultohukuk.com';

export const dynamic = 'force-dynamic';

export async function GET() {
    // Hem GET hem POST için yönlendirmeyi kullanıyoruz
    return handleRedirect();
}

export async function POST() {
    // 1. Ödeme callback'i buradan geçecektir. Ancak veritabanı güncellemesi
    //    '/api/payment/callback' adresinde zaten yapıldığı için
    //    burada sadece yönlendirme tetiklenir.
    
    // 2. Yönlendirmeden önce verilerin (POST body) okunması gerektiğini belirtmek için:
    try {
        await request.formData(); // POST gövdesini okuyup bırakıyoruz
    } catch (e) {
        // Hata olsa bile yönlendirmeye devam et, kullanıcıyı hata sayfasında bırakma
    }

    return handleRedirect();
}

// Ortak yönlendirme fonksiyonu
function handleRedirect() {
    // 307 Temporary Redirect kullanmak, Next.js ve tarayıcılar için POST'tan sonra güvenli yönlendirmedir.
    // Başka bir yöntem olan 303 See Other da aynı işi görür. 
    return NextResponse.redirect(new URL('/', DOMAIN), 307);
}