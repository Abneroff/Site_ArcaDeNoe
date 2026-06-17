import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas públicas (sem autenticação necessária)
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/cadastro",
    "/auth/callback",
    "/auth/erro",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/auth/")
  );

  // Redirecionar usuário não autenticado para login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Redirecionar usuário autenticado da landing/login para seu dashboard
  if (user && (pathname === "/" || pathname.startsWith("/auth/login"))) {
    const role = user.user_metadata?.role as string | undefined;
    const url = request.nextUrl.clone();
    if (role === "admin") {
      url.pathname = "/admin";
    } else if (role === "professora") {
      url.pathname = "/professora";
    } else {
      url.pathname = "/pais";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
