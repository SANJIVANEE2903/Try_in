import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: "read:user user:email repo",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist GitHub access token in JWT so we can use it for API calls
      if (account?.provider === "github") {
        token.githubAccessToken = account.access_token;
        token.githubLogin = (profile as any)?.login;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Expose GitHub token and login to the client session
      (session as any).githubAccessToken = token.githubAccessToken;
      (session as any).githubLogin = token.githubLogin;
      return session;
    },
  },
  
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
