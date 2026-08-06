import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const GETGRIP_URL = process.env.GETGRIP_URL ?? "http://localhost:8000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials, request) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const ip = request.headers.get("x-forwarded-for") ?? "unknown";
        const { allowed } = checkRateLimit(`login:${ip}:${email}`);
        if (!allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    {
      id: "getgrip",
      name: "GetGrip",
      type: "oauth",
      authorization: {
        url: `${GETGRIP_URL}/oauth/authorize`,
        params: { scope: "openid profile email" },
      },
      token: `${GETGRIP_URL}/oauth/token`,
      userinfo: `${GETGRIP_URL}/oauth/userinfo`,
      checks: ["pkce", "state"],
      clientId: process.env.AUTH_GETGRIP_ID,
      clientSecret: process.env.AUTH_GETGRIP_SECRET,
      profile(profile) {
        return {
          id: profile.sub as string,
          name: profile.name as string | null,
          email: profile.email as string | null,
          image: profile.picture as string | null,
        };
      },
    },
  ],
  callbacks: {
    // PrismaAdapter refuses to auto-link an OAuth sign-in to an existing
    // email/password User by design (OAuthAccountNotLinked) — that's the
    // right default for arbitrary providers, but GetGrip is our own
    // first-party identity provider, so a controlled, provider-scoped link
    // is safe here (unlike a blanket allowDangerousEmailAccountLinking,
    // which would auto-link ANY provider by email).
    signIn: async ({ user, account }) => {
      if (account?.provider !== "getgrip") return true;
      if (!user.email || !account.providerAccountId) return false;

      const existingAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "getgrip",
            providerAccountId: account.providerAccountId,
          },
        },
      });
      if (existingAccount) return true;

      const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (existingUser) {
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
          },
        });
      }

      return true;
    },
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
