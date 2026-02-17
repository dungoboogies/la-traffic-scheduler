import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*", "/week/:path*", "/stats/:path*", "/clients/:path*", "/settings/:path*"],
};
