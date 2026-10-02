import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, GUEST_DURATION_MS, sessionCookieOptions } from "@/lib/session";

// Bod 1.1/2.11: nepustí na ziadnu stranku bez platnej session, okrem
// /login a /signup samotnych (aj ich POST na Server Actions - tie idu na
// tu istu cestu). Bez /signup v tomto zozname by sa novy P nemal ako vobec
// zaregistrovat (nema este ucet = nema session = proxy by ho zacyklilo
// spat na /login, na ktorom sa tiez nema ako prihlasit). "proxy" (Next.js
// 16 - predtym "middleware", pozri AGENTS.md) tu bezi na Node.js runtime
// (od v16 default, nie Edge), takze moze priamo overit session v DB
// namiesto len citania podpisaneho JWT.
const PUBLIC_PATHS = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { email: true } } },
    });
    if (session && session.expiresAt > new Date()) {
      const response = NextResponse.next();
      // Guest ucet (bez emailu) nema ziadny iny sposob obnovit si session
      // (nemoze sa znova prihlasit cez email) - preto sa mu platnost
      // predlzuje pri kazdej navsteve, aby ho nikdy neodhlasilo, kym appku
      // pouziva aspon raz za 365 dni.
      if (session.user.email === null) {
        const expiresAt = new Date(Date.now() + GUEST_DURATION_MS);
        await prisma.session.update({ where: { id: sessionId }, data: { expiresAt } });
        response.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions(expiresAt));
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

// Ikony appky, manifest ("Pridat na plochu") a obrazky/fonty idu bez
// prihlasenia - telefon si ikonu a manifest stahuje aj bez session cookie.
// (Nahrate fotky v public/uploads maju nahodne nazvy, rovnako ako tie vo
// Vercel Blob, ktore su verejne dostupne cez svoju adresu.)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|webp|svg|ico|ttf|woff2?)$).*)",
  ],
};
