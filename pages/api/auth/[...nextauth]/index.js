import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // ...add more providers here
  ],
  secret: "sdgetthwwwthbetvfvwrthgwvte",
  // callbacks: {
  //   async signIn({ account, profile }) {
  //     if (account.provider === "google") {
  //       console.log("test", profile.email, profile.email_verified);
  //       return profile.email_verified && profile.email.endsWith("@email.com");
  //     }
  //     return true; // Do different verification for other providers that don't have `email_verified`
  //   },
  // },
};

export default NextAuth(authOptions);
