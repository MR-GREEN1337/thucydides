import NextAuth, { NextAuthOptions, User, Account } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("FATAL: NEXT_PUBLIC_API_URL environment variable is not set.");
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Fallback to old refresh token if the new one isn't sent
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('RefreshAccessTokenError', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}


export const authOptions: NextAuthOptions = {
secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // We need to request offline access to get a refresh token from Google
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        try {
          const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(errorData.detail || "Invalid credentials");
          }

          const tokens = await loginResponse.json();
          if (tokens.access_token) {
            // We need to fetch the user profile to populate the session
            const userResponse = await fetch(`${apiUrl}/api/v1/users/me`, {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });

            if (!userResponse.ok) {
              throw new Error("Failed to fetch user profile after login.");
            }
            const userProfile = await userResponse.json();

            // Attach tokens and stripe status to the user object to pass them to the JWT callback
            return {
              ...userProfile,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              accessTokenExpires: Date.now() + tokens.expires_in * 1000,
            };
          }
          return null;
        } catch (error: any) {
          // This error message will be displayed on the sign-in page
          throw new Error(error.message);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // --- HANDLE GOOGLE SIGN IN ---
        if (account.provider === "google") {
          try {
            // Exchange Google token for our backend's tokens
            const response = await fetch(`${apiUrl}/api/v1/auth/google/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_token: account.id_token }),
            });

            if (!response.ok) {
              throw new Error('Google login with backend failed.');
            }

            const backendTokens = await response.json();

            // Now populate the token with our backend's JWTs
            token.accessToken = backendTokens.access_token;
            token.refreshToken = backendTokens.refresh_token;
            token.accessTokenExpires = Date.now() + backendTokens.expires_in * 1000;

            // Fetch user profile using the new backend token
            const userResponse = await fetch(`${apiUrl}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${token.accessToken}` },
            });
            const userProfile = await userResponse.json();

            token.id = userProfile.id;
            token.name = userProfile.full_name;
            token.email = userProfile.email;
            token.stripe_subscription_status = userProfile.stripe_subscription_status;

            return token;

          } catch (error) {
             console.error("Error during Google sign-in with backend", error);
             return { ...token, error: "GoogleLoginError" };
          }
        }

        // --- HANDLE CREDENTIALS SIGN IN ---
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.id = user.id;
        token.stripe_subscription_status = user.stripe_subscription_status;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Pass custom properties to the session object
      session.user.id = token.id as string;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.stripe_subscription_status = token.stripe_subscription_status as string;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
