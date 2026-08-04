import { auth } from "@/lib/auth";

export const proxy = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/accounts/:path*",
    "/budgets/:path*",
    "/settings/:path*",
  ],
};
