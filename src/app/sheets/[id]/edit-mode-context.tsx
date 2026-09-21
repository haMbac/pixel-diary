"use client";

import { createContext, useContext } from "react";

// Ci je stranka sheetu prave v "edit rezime" - zapina/vypina sa tlacidlom
// ✎ v SheetPageShell. Cez Context sa to dostane aj do SheetEditor
// (Guma v legende sa ukazuje len ked je editMode zapnuty), aj ked su to
// oddelene komponenty prepojene len cez {children} zo Server Componentu.
const EditModeContext = createContext(false);

export const EditModeProvider = EditModeContext.Provider;

export function useEditMode(): boolean {
  return useContext(EditModeContext);
}
