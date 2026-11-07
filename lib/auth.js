import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-google-client-secret",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "dummy-github-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "dummy-github-client-secret",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
    async signIn({ user }) {
      if (user?.email) {
        try {
          const connectDb = (await import("@/lib/connectDb")).default;
          const UserHistory = (await import("@/models/UserHistory")).default;
          await connectDb();
          const targetEmail = user.email.toLowerCase();
          const updateData = {};
          if (user.name) updateData.name = user.name;
          if (user.image) updateData.image = user.image;

          await UserHistory.updateOne(
            { email: targetEmail },
            {
              $setOnInsert: { email: targetEmail, history: [] },
              $set: updateData,
            },
            { upsert: true }
          );
        } catch (err) {
          console.error("Error syncing OAuth user in DB:", err);
        }
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "what-if-map-secret-key-12345",
};

