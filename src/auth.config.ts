import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === '/login';
      const isPublicApproval = nextUrl.pathname.startsWith('/approval');
      const isApiAuth = nextUrl.pathname.startsWith('/api/auth');

      // Izinkan akses publik
      if (isPublicApproval || isApiAuth) {
        return true;
      }

      // Jika belum login dan bukan di login page, lempar ke /login
      if (!isLoggedIn && !isLoginPage) {
        return false;
      }

      // Jika sudah login dan mengakses /login, arahkan ke dasbor
      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // RBAC Guard untuk Admin & Owner
      if (isLoggedIn) {
        const userRole = (auth?.user as any)?.role;
        const adminOnlyRoutes = ['/pengguna', '/pengaturan'];
        const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';

        if (adminOnlyRoutes.some((route) => nextUrl.pathname.startsWith(route)) && !isAdminOrOwner) {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      return true;
    },
  },
  providers: [], // Didefinisikan di auth.ts (Node.js runtime)
} satisfies NextAuthConfig;

