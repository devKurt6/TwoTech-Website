import { api } from "../lib/api";
import { defaults } from "../data/settings";
import { useResource } from "./useResource";
export function useSettings() {
  return useResource(api.settings, defaults);
}
