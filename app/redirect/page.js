import { NextResponse } from "next/server";

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://www.consultohukuk.com";

export const dynamic = "force-dynamic";

// Tarayıcıdan GET isteği gelirse (kullanıcı URL'yi açarsa)
export async function GET() {
  return NextResponse.redirect(new URL("/", DOMAIN), 307);
}

// Shopier POST ile gönderirse de aynı şekilde yönlendir
export async function POST() {
  return NextResponse.redirect(new URL("/", DOMAIN), 307);
}