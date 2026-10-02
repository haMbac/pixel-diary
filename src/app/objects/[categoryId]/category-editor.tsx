"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/context";
import type { AttributeSchema, AttributeValueType, RatingDisplay } from "@/lib/objects";
import { isFeatured } from "@/lib/attribute-schema";
import { useEditMode } from "../../edit-mode-context";
import { AddAttributeForm } from "./add-attribute-form";
import { ObjectForm, type ObjectFormValues } from "./object-form";
import { IconGlyph } from "../../icon-glyph";
import { IconPicker } from "../../icon-picker";

type ActionState = { error: string | null };
type FormAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

export type ObjectAttributeData = {
  templateId: string;
  name: string;
  type: AttributeValueType;
  ratingScale: number | null;
  ratingDisplay: RatingDisplay | null;
  featured: boolean | null;
  value: string | null;
};

export type ObjectData = {
  id: string;
  name: string;
  // "icon" = efektivna (vlastna alebo zdedena od kategorie), na zobrazenie.
  // "ownIcon" = surova vlastna hodnota (null = zdeduje), pre edit formular.
  icon: string | null;
  ownIcon: string | null;
  attributes: ObjectAttributeData[];
};

// Bod: hodnotenie sa zobrazuje ako hviezdicky (predvolene) alebo ako
// obycajne cislo, podla volby pri atribute (ratingDisplay). Chybajuce pole
// (starsi atribut spred tejto volby) sa berie ako "stars".
function AttributeValueDisplay({ attr }: { attr: ObjectAttributeData }) {
  if (attr.value == null || attr.value === "") return <>—</>;

  if (attr.type === "RATING") {
    const scale = attr.ratingScale ?? 5;
    const value = Math.max(0, Math.min(scale, Number(attr.value) || 0));
    if (attr.ratingDisplay === "number") {
      return (
        <>
          {value}/{scale}
        </>
      );
    }
    return (
      <span style={{ color: "var(--accent)" }}>
        {"★".repeat(value)}
        <span style={{ color: "#d1d5db" }}>{"☆".repeat(scale - value)}</span>
      </span>
    );
  }

  return <>{attr.value}</>;
}

function typeLabel(attr: AttributeSchema, t: ReturnType<typeof useT>): string {
  if (attr.type === "TEXT") return t.object.attributeTypeText;
  if (attr.type === "NUMBER") return t.object.attributeTypeNumber;
  return t.object.attributeTypeRatingOf(attr.ratingScale ?? 5);
}

export function CategoryEditor({
  categoryName,
  categoryIcon,
  setCategoryIcon,
  template,
  objects,
  renameCategory,
  deleteCategory,
  addAttribute,
  editAttribute,
  deleteAttribute,
  createObject,
  updateObject,
  deleteObject,
}: {
  categoryName: string;
  categoryIcon: string | null;
  setCategoryIcon: (value: string | null) => Promise<void>;
  template: AttributeSchema[];
  objects: ObjectData[];
  renameCategory: FormAction;
  deleteCategory: () => Promise<void>;
  addAttribute: FormAction;
  editAttribute: FormAction;
  deleteAttribute: (templateId: string) => Promise<void>;
  createObject: FormAction;
  updateObject: FormAction;
  deleteObject: (objektId: string) => Promise<void>;
}) {
  const t = useT();
  return (
    // "atributy-objekty" (globals.css) - vlastna trieda, nie zdielana
    // "legenda-mriezka" so SheetEditor: uzsi prvy stlpec (280px), lebo
    // Objekty su teraz mriezka vacsich dlazdic a potrebuju vacsinu sirky.
    // Pod 481px stlpce pod sebou, od 481px vedla seba.
    <div className="atributy-objekty">
      <div>
        <CategoryNameHeader
          name={categoryName}
          icon={categoryIcon}
          setIcon={setCategoryIcon}
          renameCategory={renameCategory}
          deleteCategory={deleteCategory}
        />
        <h3 className="text-lg font-medium mb-3">{t.object.attributesHeading}</h3>
        <div
          style={{
            border: `2px solid var(--border)`,
            borderRadius: 12,
            backgroundColor: "var(--card-fill)",
          }}
          className="p-3 mb-3"
        >
          {template.length === 0 ? (
            <p className="text-gray-500">{t.object.noAttributesMessage}</p>
          ) : (
            <ul className="list-none space-y-2">
              {template.map((attr) => (
                <AttributeRow
                  key={attr.id}
                  attribute={attr}
                  editAttribute={editAttribute}
                  deleteAttribute={deleteAttribute}
                />
              ))}
            </ul>
          )}
        </div>

        <EditOnly>
          <AddAttributeForm action={addAttribute} />
        </EditOnly>
      </div>

      <div>
        <h3 className="text-lg font-medium mt-8 mb-3">{t.object.objectsHeading}</h3>
        <ObjectsList
          template={template}
          objects={objects}
          categoryIcon={categoryIcon}
          createObject={createObject}
          updateObject={updateObject}
          deleteObject={deleteObject}
        />
      </div>
    </div>
  );
}

function EditOnly({ children }: { children: ReactNode }) {
  const editMode = useEditMode();
  if (!editMode) return null;
  return <>{children}</>;
}

// Bod 4.13: premenovanie kategorie (v edit rezime) + bod 4.14: vymazanie
// kategorie ("X" nahradene tlacidlom priamo na jej stranke - Sheets zatial
// nema vlastnu obdobu tohto tlacidla vobec postavenu, takze tu nie je co
// napodobit; umiestnenie na stranke kategorie namiesto v menu je
// najjednoduchsie a najviac cita s tym, ako uz stranka funguje).
function CategoryNameHeader({
  name,
  icon,
  setIcon,
  renameCategory,
  deleteCategory,
}: {
  name: string;
  icon: string | null;
  setIcon: (value: string | null) => Promise<void>;
  renameCategory: FormAction;
  deleteCategory: () => Promise<void>;
}) {
  const editMode = useEditMode();
  const router = useRouter();
  const t = useT();
  const [state, formAction, isPending] = useActionState(renameCategory, { error: null });
  const [deleting, startDeleteTransition] = useTransition();
  const [, startIconTransition] = useTransition();

  if (!editMode) {
    return <h1 className="text-2xl font-semibold mt-2 mb-6">{name}</h1>;
  }

  return (
    <div className="mt-2 mb-6">
      <div className="flex gap-2 items-center mb-2">
        <IconPicker
          value={icon}
          onChange={(value) => startIconTransition(() => setIcon(value))}
          size={44}
          label={t.object.changeCategoryIconLabel}
        />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.object.defaultIconHint}
        </span>
      </div>
      {/* Stlpec je uzky (200px) - nazov na celu sirku, tlacidlo pod nim.
          Vedla seba sa nezmestili a tlacidlo pretekalo do stlpca Objekty. */}
      <form action={formAction} className="flex flex-col items-start gap-2">
        <input
          type="text"
          name="name"
          defaultValue={name}
          required
          className="text-2xl font-semibold border-b w-full min-w-0 focus:outline-none bg-transparent"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-sm px-3 py-1 rounded border disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {isPending ? t.object.savingEllipsis : t.object.saveNameButton}
        </button>
      </form>
      {state.error && <p className="text-red-600 text-sm mt-1">{state.error}</p>}
      <button
        type="button"
        onClick={() => {
          if (!window.confirm(t.object.deleteCategoryConfirm(name))) {
            return;
          }
          startDeleteTransition(async () => {
            await deleteCategory();
            router.push("/");
          });
        }}
        disabled={deleting}
        className="text-red-600 text-sm mt-2 hover:underline disabled:opacity-50"
      >
        {deleting ? t.object.deletingEllipsis : t.object.deleteCategoryButton}
      </button>
    </div>
  );
}

// Bod 4.31/4.32/4.33: jeden riadok sablony atributu - v edit rezime sa da
// prepnut na inline formular (premenovat/zmenit typ) alebo vymazat.
function AttributeRow({
  attribute,
  editAttribute,
  deleteAttribute,
}: {
  attribute: AttributeSchema;
  editAttribute: FormAction;
  deleteAttribute: (templateId: string) => Promise<void>;
}) {
  const editMode = useEditMode();
  const t = useT();
  const [editingThis, setEditingThis] = useState(false);
  const [state, formAction, isPending] = useActionState(editAttribute, { error: null });
  const [, startTransition] = useTransition();

  const [name, setName] = useState(attribute.name);
  const [type, setType] = useState<AttributeValueType>(attribute.type);
  const [ratingScale, setRatingScale] = useState(attribute.ratingScale ?? 5);
  const [ratingDisplay, setRatingDisplay] = useState<RatingDisplay>(
    attribute.ratingDisplay ?? "stars"
  );
  const [featured, setFeatured] = useState(isFeatured(attribute));

  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setEditingThis(false);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  if (editMode && editingThis) {
    return (
      <li>
        <form action={formAction} className="flex flex-wrap gap-2 items-center py-1">
          <input type="hidden" name="templateId" value={attribute.id} />
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as AttributeValueType)}
            className="border rounded px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <option value="TEXT">{t.object.attributeTypeTextOption}</option>
            <option value="NUMBER">{t.object.attributeTypeNumberOption}</option>
            <option value="RATING">{t.object.attributeTypeRatingOption}</option>
          </select>
          {type === "RATING" && (
            <>
              <select
                name="ratingScale"
                value={ratingScale}
                onChange={(e) => setRatingScale(Number(e.target.value) === 10 ? 10 : 5)}
                className="border rounded px-2 py-1 text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                <option value={5}>{t.object.ratingScaleOf5Option}</option>
                <option value={10}>{t.object.ratingScaleOf10Option}</option>
              </select>
              <select
                name="ratingDisplay"
                value={ratingDisplay}
                onChange={(e) => setRatingDisplay(e.target.value as RatingDisplay)}
                className="border rounded px-2 py-1 text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="stars">{t.object.ratingDisplayStarsOption}</option>
                <option value="number">{t.object.ratingDisplayNumberOption}</option>
              </select>
            </>
          )}
          <input
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 min-w-[6rem] border rounded px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              name="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            {t.object.featuredCheckboxLabel}
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="text-sm px-2 py-1 rounded border disabled:opacity-50"
            style={{ borderColor: "var(--border)" }}
          >
            {isPending ? t.object.savingBrief : t.object.saveButton}
          </button>
          <button
            type="button"
            onClick={() => setEditingThis(false)}
            className="text-sm text-gray-400 px-1"
          >
            {t.object.cancelButton}
          </button>
        </form>
        {state.error && <p className="text-red-600 text-xs">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 py-1">
      <span className="flex-1">
        {attribute.name}
        <span className="text-xs text-gray-400 ml-2">{typeLabel(attribute, t)}</span>
        {isFeatured(attribute) && (
          <span
            className="text-xs ml-2"
            style={{ color: "var(--accent)" }}
            title={t.object.featuredOnTileTooltip}
          >
            {t.object.featuredIndicatorText}
          </span>
        )}
      </span>
      {editMode && (
        <>
          <button
            type="button"
            onClick={() => setEditingThis(true)}
            className="text-gray-400 hover:text-gray-700 text-sm p-1"
            title={t.object.editButtonTitle}
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => deleteAttribute(attribute.id))}
            className="text-gray-400 hover:text-red-600 text-sm p-1"
            title={t.object.deleteButtonTitle}
          >
            ✕
          </button>
        </>
      )}
    </li>
  );
}

// "created" = povodne poradie (vytvorenia, asc zo servera); inak "name"
// alebo templateId konkretneho atributu.
type SortKey = "created" | "name" | string;

function compareObjects(a: ObjectData, b: ObjectData, sortBy: SortKey, dirMul: number): number {
  if (sortBy === "name") return dirMul * a.name.localeCompare(b.name, "sk");

  const attrA = a.attributes.find((x) => x.templateId === sortBy);
  const attrB = b.attributes.find((x) => x.templateId === sortBy);
  const valA = attrA?.value ?? null;
  const valB = attrB?.value ?? null;
  // Chybajuca hodnota ide vzdy na koniec, bez ohladu na smer radenia.
  if (valA == null && valB == null) return 0;
  if (valA == null) return 1;
  if (valB == null) return -1;
  if (attrA?.type === "TEXT") return dirMul * valA.localeCompare(valB, "sk");
  return dirMul * (Number(valA) - Number(valB));
}

// Bod 4.21/4.22/4.23: zoznam objektov kategorie ako mriezka väčších
// dlaždíc (ikona + meno + len OZNAČENÉ ("featured") atribúty - ostatné
// vidno až po kliknutí do editacneho formulara). Klik na dlaždicu otvori
// modal na upravenie, "+ Nový objekt" otvori ten isty modal prazdny. "✕"
// (len v edit rezime, prekryta v rohu dlaždice) objekt rovno vymaze -
// rovnaky vzor ako mazanie hodnoty v SheetEditor (bez potvrdzovacieho
// dialogu).
function ObjectsList({
  template,
  objects,
  categoryIcon,
  createObject,
  updateObject,
  deleteObject,
}: {
  template: AttributeSchema[];
  objects: ObjectData[];
  categoryIcon: string | null;
  createObject: FormAction;
  updateObject: FormAction;
  deleteObject: (objektId: string) => Promise<void>;
}) {
  const editMode = useEditMode();
  const t = useT();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  // Atribut, podla ktoreho sa prave triedi, ak to nie je "created"/"name" -
  // pouzite nizsie na to, aby sa jeho hodnota zobrazila na dlazdici aj ked
  // nie je "featured" (bod: "ked sa triedi podla atributu, ktory dlazdica
  // bezne neukazuje, uka ho, kym sa podla neho triedi").
  const sortAttrId = sortBy !== "created" && sortBy !== "name" ? sortBy : null;

  const editingObject = objects.find((o) => o.id === editingId) ?? null;
  const modalOpen = creating || editingObject !== null;

  function closeModal() {
    setCreating(false);
    setEditingId(null);
  }

  const editingValues: ObjectFormValues | undefined = editingObject
    ? {
        name: editingObject.name,
        icon: editingObject.ownIcon,
        attributes: Object.fromEntries(
          editingObject.attributes.map((a) => [a.templateId, a.value ?? ""])
        ),
      }
    : undefined;

  const sortedObjects =
    sortBy === "created"
      ? sortDir === "desc"
        ? [...objects].reverse()
        : objects
      : [...objects].sort((a, b) => compareObjects(a, b, sortBy, sortDir === "desc" ? -1 : 1));

  return (
    <>
      {objects.length > 1 && (
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.object.sortByLabel}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <option value="created">{t.object.sortByCreatedOption}</option>
            <option value="name">{t.object.sortByNameOption}</option>
            {template.map((attr) => (
              <option key={attr.id} value={attr.id}>
                {attr.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title={sortDir === "asc" ? t.object.sortAscendingTitle : t.object.sortDescendingTitle}
            className="text-sm px-2 py-1 rounded border"
            style={{ borderColor: "var(--border)" }}
          >
            {sortDir === "asc" ? "▲" : "▼"}
          </button>
        </div>
      )}

      {objects.length === 0 ? (
        <p className="text-gray-500 mb-3">{t.object.noObjectsMessage}</p>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 150px)", gap: 12 }}
          className="mb-3"
        >
          {sortedObjects.map((obj) => {
            const featuredAttrs = obj.attributes.filter((a) => isFeatured(a));
            const sortAttr =
              sortAttrId && !featuredAttrs.some((a) => a.templateId === sortAttrId)
                ? (obj.attributes.find((a) => a.templateId === sortAttrId) ?? null)
                : null;
            return (
              <div key={obj.id} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setEditingId(obj.id)}
                  style={{
                    border: `2px solid var(--border)`,
                    borderRadius: 12,
                    backgroundColor: "var(--card-fill)",
                    width: "100%",
                  }}
                  className="flex flex-col items-center gap-1 p-2 text-left"
                >
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 8,
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--paper-line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconGlyph value={obj.icon} fit="cover" />
                  </div>
                  <span className="font-medium text-sm truncate w-full text-center">
                    {obj.name}
                  </span>
                  {featuredAttrs.map((attr) => (
                    <span
                      key={attr.templateId}
                      className="text-xs whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <AttributeValueDisplay attr={attr} />
                    </span>
                  ))}
                  {sortAttr && (
                    <span
                      className="text-xs whitespace-nowrap"
                      style={{ color: "var(--accent)" }}
                    >
                      <AttributeValueDisplay attr={sortAttr} />
                    </span>
                  )}
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => startTransition(() => deleteObject(obj.id))}
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      background: "var(--card-fill)",
                      border: `1px solid var(--border)`,
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                    }}
                    className="text-gray-400 hover:text-red-600 text-xs flex items-center justify-center"
                    title={t.object.deleteButtonTitle}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {template.length === 0 ? (
        <EditOnly>
          <p className="text-sm text-amber-600 mb-3">
            {t.object.addAttributeFirstMessage}
          </p>
        </EditOnly>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="text-sm px-3 py-2 rounded border"
          style={{ borderColor: "var(--border)" }}
        >
          {t.object.newObjectButton}
        </button>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-30"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ border: `2px solid var(--border)`, borderRadius: 20 }}
            className="bg-white p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                {editingObject ? editingObject.name : t.object.newObjectHeading}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t.object.closeButtonTitle}
                title={t.object.closeButtonTitle}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            {editingObject ? (
              <ObjectForm
                key={editingObject.id}
                template={template}
                categoryIcon={categoryIcon}
                action={updateObject}
                objektId={editingObject.id}
                initialValues={editingValues}
                submitLabel={t.object.saveButton}
                pendingLabel={t.object.savingEllipsis}
                onSuccess={closeModal}
              />
            ) : (
              <ObjectForm
                key="new"
                template={template}
                categoryIcon={categoryIcon}
                action={createObject}
                submitLabel={t.object.createObjectButton}
                pendingLabel={t.object.creatingEllipsis}
                onSuccess={closeModal}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
