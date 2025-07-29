import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // This function is executed *after* the `authorized` callback returns true.
  // Its purpose is to handle redirects for users who are already logged in.
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.nextauth.token;

    // If the user is authenticated and tries to access sign-in or sign-up,
    // redirect them to the dashboard.
    if (isAuthenticated && (pathname.startsWith("/signin") || pathname.startsWith("/signup"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Otherwise, allow the request to proceed.
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback decides if a user is authorized to access a page.
      // It runs before the main middleware function above.
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        const isAuthenticated = !!token;

        // Define which routes are considered public auth pages (accessible even when not logged in).
        const isPublicAuthRoute = pathname.startsWith("/signin") || pathname.startsWith("/signup");

        // If the user is trying to access a public auth route, they are always "authorized" to see it.
        // The middleware function above will handle redirecting them if they are *already* logged in.
        if (isPublicAuthRoute) {
          return true;
        }

        // For any other route that is not a public auth route, the user *must* be authenticated.
        // If they are not, this will return false, and they will be redirected to the `signIn` page.
        if (!isAuthenticated) {
          return false;
        }

        // If they are authenticated and not on a public auth route, they are authorized.
        return true;
      },
    },
    // If the `authorized` callback returns false, this is the page the user will be redirected to.
    pages: {
      signIn: "/signin",
    },
  }
);

// The matcher configuration remains the same. It defines which routes the
// entire `withAuth` middleware logic (including callbacks) will run on.
export const config = {
  matcher: [
    // Protected application routes
    "/dashboard/:path*",
    "/archive/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/chat/:path*",

    // Auth routes (which need logic to redirect logged-in users)
    "/signin",
    "/signup",
  ],
};
