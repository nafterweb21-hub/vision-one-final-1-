import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { PermissionsMap } from "@/lib/access";
import { cookies } from "next/headers";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      employeeId: string | null;
      permissions: PermissionsMap;
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
    employeeId: string | null;
  }
}

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");
          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.passwordHash || !user.isActive) return null;

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
            employeeId: user.employeeId,
          };
        } catch (error) {
          console.error("AUTH_AUTHORIZE_ERROR", error);
          throw error;
        }
      },
    }),
  ],
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

export const auth = async (...args: any[]) => {
  try {
    // @ts-ignore - pass args down to NextAuth's auth
    return await nextAuth.auth(...args);
  } catch (error: any) {
    console.warn("Caught error in auth(), returning null session:", error?.message || String(error));
    return null;
  }
};
