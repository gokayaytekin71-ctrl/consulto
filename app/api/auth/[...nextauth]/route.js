// app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from '@/lib/prisma'; // Bu yolu '@/' alias ile değiştirmek daha iyi olabilir
import GoogleProvider from "next-auth/providers/google";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    // DEĞİŞİKLİK BURADA: Sunucu tarafı uyumluluğu için .default eklendi.
   GoogleProvider.default({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session?.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth.default(authOptions);
export { handler as GET, handler as POST };