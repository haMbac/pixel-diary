import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

// Bod 1.1: nahradene skutocnym prihlasovanim (predtym "docasne" - prvy
// user v DB). "proxy.ts" uz zvycajne presmeruje neprihlaseneho P na
// /login skor, nez sa sem vobec dostane, ale toto ostava ako druha
// poistka priamo tu (Next.js odporuca overovat aj vnutri kazdej Server
// Function, nie sa spoliehat len na Proxy). V React cache(), aby stranka a
// jej generateMetadata v jednej poziadavke nedopytovali session dvakrat.
export const getCurrentUser = cache(async () => {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});
