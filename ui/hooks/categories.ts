import { useQuery } from "@tanstack/react-query";
import { uniq } from "lodash-es";
import { useModelList } from "./dataHooks.ts";

export const FAVORITES_CATEGORY = "favorites";
export const DOWNLOADED_CATEGORY = "downloaded";
export const VALIDATED = "validated";
export const ALL_CATEGORY = "all";
const DEFAULT_CATEGORIES = [FAVORITES_CATEGORY, DOWNLOADED_CATEGORY, ALL_CATEGORY, VALIDATED];
export const useVoiceModelCategories = () => {
  const { data: models } = useModelList();

  return useQuery(["voiceModelCategories", models?.length], async () => {
    const categories = new Set<string>();
    for (const model of models || []) {
      categories.add(model.metadata?.classification || "unknown");
    }
    return uniq([
      FAVORITES_CATEGORY,
      DOWNLOADED_CATEGORY,
      VALIDATED,
      ALL_CATEGORY,
      "musician",
      "politician",
      "video game",
      "fictional character",
      "notable person",
      "anime",
      "entertainment",
      "unknown",
      ...categories,
    ]).filter((l) => categories.has(l) || DEFAULT_CATEGORIES.includes(l));
  });
};
