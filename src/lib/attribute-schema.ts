// Zdielane typy pre schemu atributov kategorie - zamerne BEZ akehokolvek
// importu z objects.ts (ten na vrchu importuje "prisma", cez adapter-pg
// pouzivajuci Node-only "dns"/"net"). Klientske komponenty (napr.
// category-editor.tsx) potrebuju "isFeatured" ako SKUTOCNU hodnotu (nie
// len typ na kompilacny cas) - kedykolvek by klientsky kod importoval
// hocijaku hodnotu z objects.ts, zabalil by sa do klientskeho balicka aj
// server-only Prisma/pg import a build by zlyhal ("Module not found:
// Can't resolve 'dns'").
export type AttributeValueType = "TEXT" | "NUMBER" | "RATING";
export type RatingDisplay = "stars" | "number";

// Schema jedneho atributu kategorie - ulozena v ObjCategory.template (Json).
// "id" je stabilna identita (generovana cez crypto.randomUUID() pri
// vytvoreni atributu), na ktoru sa odkazuju jednotlive Attribute riadky
// (Attribute.templateId) - vdaka tomu premenovanie atributu neprerusi
// prepojenie na uz existujuce hodnoty.
export type AttributeSchema = {
  id: string;
  name: string;
  type: AttributeValueType;
  ratingScale?: 5 | 10;
  // Ako sa hodnotenie zobrazuje aj vypĺňa - hviezdičky (predvolené) alebo
  // obyčajné číslo. Chýbajúce pole (staršie atribúty spred tejto voľby) sa
  // všade berie ako "stars", aby sa im nezmenilo správanie.
  ratingDisplay?: RatingDisplay;
  // Ci sa atribut zobrazuje na kompaktnej dlazdici objektu (bod: "moznost
  // vybrat, ktore atributy su hlavne"). Chybajuce pole (starsi atribut
  // spred tejto volby) sa berie cez isFeatured() nizsie - "hodnotenie ano,
  // ostatne nie", aby sa nic nezmenilo, kym to niekto vyslovene nezmeni.
  featured?: boolean;
};

// Centralizovane na jednom mieste, aby vsade (formulare, dlazdice) platilo
// rovnake pravidlo pre chybajuce pole. Prijima aj null (nie len undefined) -
// ObjectAttributeData (nacitane z DB cez Prisma) pouziva null pre
// "nenastavene", zatial co AttributeSchema (JSON sablona) pouziva undefined.
export function isFeatured(attr: {
  type: AttributeValueType;
  featured?: boolean | null;
}): boolean {
  return attr.featured ?? attr.type === "RATING";
}
