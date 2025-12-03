import { NextResponse } from "next/server";

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://www.consultohukuk.com";

export async function GET() {
  return NextResponse.redirect(new URL("/", DOMAIN), 307);
}

export async function POST() {
  return NextResponse.redirect(new URL("/", DOMAIN), 307);
}