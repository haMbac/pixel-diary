"use client";

import { createContext, useContext } from "react";

// Ci je stranka (sheetu alebo kategorie) prave v "edit rezime" - zapina/
// vypina sa tlacidlom ✎ v SheetPageShell/ObjectPageShell. Cez Context sa to
// dostane aj do vnorenych komponentov (napr. Guma v legende sheetu, alebo
// edit/delete kontroly pri atributoch a objektoch), aj ked su to oddelene
// komponenty prepojene len cez {children} zo Server Componentu. Zdielane
// medzi Sheets aj Objekty - je to obycajny boolean context bez logiky
// specifickej pre jednu ci druhu funkciu appky.
const EditModeContext = createContext(false);

export const EditModeProvider = EditModeContext.Provider;

export function useEditMode(): boolean {
  return useContext(EditModeContext);
}
