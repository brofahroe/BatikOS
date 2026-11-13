import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isLoginPage = nextUrl.pathname === '/login';
  const isPublicApproval = nextUrl.pathname.startsWith('/approval');
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth');

  // Izinkan akses publik
  if (isPublicApproval || isApiAuth) {
    return NextResponse.next();
  }

  // Jika belum login dan bukan di login page, lempar ke /login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Jika sudah login dan mengakses /login, arahkan ke dasbor utama
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // RBAC Guard untuk menu Admin / Owner
  if (isLoggedIn) {
    const adminOnlyRoutes = ['/pengguna', '/pengaturan'];
    const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';

    if (adminOnlyRoutes.some((route) => nextUrl.pathname.startsWith(route)) && !isAdminOrOwner) {
      return NextResponse.redirect(new URL('/', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};

