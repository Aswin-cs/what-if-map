import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";

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
          await connectDb();
          const targetEmail = user.email.toLowerCase();
          let existingUser = await UserHistory.findOne({ email: targetEmail });
          if (!existingUser) {
            await UserHistory.create({
              email: targetEmail,
              name: user.name || "",
              image: user.image || "",
              history: [],
            });
          } else {
            let needsSave = false;
            if (user.name && !existingUser.name) {
              existingUser.name = user.name;
              needsSave = true;
            }
            if (user.image && !existingUser.image) {
              existingUser.image = user.image;
              needsSave = true;
            }
            if (needsSave) {
              await existingUser.save();
            }
          }
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

