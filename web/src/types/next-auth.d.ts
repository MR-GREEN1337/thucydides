import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      stripe_subscription_status?: string;
    } & DefaultSession["user"];
  }

  interface User {
      accessToken?: string;
      accessTokenExpires?: number;
      refreshToken?: string;
      stripe_subscription_status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessTokenExpires?: number;
    accessToken?: string;
    refreshToken?: string;
    id?: string;
    error?: string;
    stripe_subscription_status?: string;
  }
}
