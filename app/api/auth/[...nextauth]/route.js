import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from '@/lib/prisma';
import GoogleProvider from "next-auth/providers/google";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
   GoogleProvider.default({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.tokenBalance = user.tokenBalance; // Login anındaki bakiye
      }

      // Client tarafında update() çağrılırsa session'ı güncelle
      if (trigger === "update" && session?.tokenBalance) {
        token.tokenBalance = session.tokenBalance;
      }

      // Güvenli yöntem: Her istekte DB'den güncel bakiyeyi çek
      if (token.id) {
          const freshUser = await prisma.user.findUnique({
             where: { id: token.id },
             select: { tokenBalance: true }
          });
          if(freshUser) {
             token.tokenBalance = freshUser.tokenBalance;
          }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session?.user) {
        session.user.id = token.id;
        // Token bakiyesini session'a ekle ki frontend görebilsin
        session.user.tokenBalance = token.tokenBalance;
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