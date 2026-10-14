import { useCallback } from "react";
import { api } from "../lib/api";
import { useResource } from "./useResource";
export function useProducts(all = false) {
  const loader = useCallback(() => api.products(all), [all]);
  return useResource(loader);
}
