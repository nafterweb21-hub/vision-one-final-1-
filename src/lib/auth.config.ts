import type { NextAuthConfig } from "next-auth";

// Edge-safe NextAuth config: no DB-touching providers, no Node-only imports.
// Used by middleware to check auth state via the JWT cookie.
// The full config in auth.ts extends this with the Credentials provider.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  providers: [],
  debug: true,
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = (user as { id: string }).id;
          token.role = (user as { role: string }).role;
          token.employeeId = (user as { employeeId: string | null }).employeeId;
        }
        return token;
      } catch (error) {
        console.error("AUTH_JWT_ERROR", error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.employeeId = token.employeeId as string | null;
        }
        return session;
      } catch (error) {
        console.error("AUTH_SESSION_ERROR", error);
        throw error;
      }
    },
  },
} satisfies NextAuthConfig;
