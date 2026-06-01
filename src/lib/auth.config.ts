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
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
        token.employeeId = (user as { employeeId: string | null }).employeeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.employeeId = token.employeeId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
