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
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  events: {
    async signIn({ user }) {
      if (!user?.id) return;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastSeenAt: new Date(),
            loginCount: { increment: 1 },
          },
        });

        await prisma.userActivityLog.create({
          data: {
            userId: user.id,
            type: "LOGIN",
            path: "/auth/signin",
          },
        });
      } catch (error) {
        console.error("LOGIN_ACTIVITY_LOG_ERROR", error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.tokenBalance = user.tokenBalance ?? 0; // Sadece login anındaki bakiye
      }

      if (trigger === "update" && session?.tokenBalance !== undefined) {
        token.tokenBalance = session.tokenBalance;
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.id && session?.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        // Token bakiyesini session'a ekle ki frontend görebilsin
        session.user.tokenBalance = token.tokenBalance ?? 0;
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