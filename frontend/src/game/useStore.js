import { createContext, useContext, useSyncExternalStore } from "react";
export const GameCtx = createContext(null);
export const useCtrl = () => useContext(GameCtx);
/** Lit une valeur du store ; le sélecteur doit renvoyer une référence stable (primitive ou sous-objet de l'état). */
export function useGame(sel) {
  const c = useContext(GameCtx);
  return useSyncExternalStore(c.store.subscribe, () => sel(c.store.get()), () => sel(c.store.get()));
}
/** Variante sans contexte (le <Canvas> de R3F est une racine React séparée : le contexte n'y passe pas). */
export function useSel(ctrl, sel) {
  return useSyncExternalStore(ctrl.store.subscribe, () => sel(ctrl.store.get()), () => sel(ctrl.store.get()));
}
