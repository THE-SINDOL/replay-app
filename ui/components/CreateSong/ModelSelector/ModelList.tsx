import type { ArtistModelOption } from "@replay/electron/clients/modelWeights.ts";
import * as React from "react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";
import { useReplay } from "../../../context.tsx";
import { ALL_CATEGORY, DOWNLOADED_CATEGORY, FAVORITES_CATEGORY, VALIDATED } from "../../../hooks/categories.ts";
import Fuse from "fuse.js";
import type { VirtuosoHandle } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";
import { InputBase } from "@mui/material";
import theme from "../../theme.ts";
import { ModelWrapper } from "./shared.tsx";
import { Model } from "./Model.tsx";
import { filter } from "lodash-es";
import path from "path-browserify";
import { useFavorites, useModelList } from "../../../hooks/dataHooks.ts";

const ModelNameFilter = ({ setFilter }: { setFilter: Dispatch<SetStateAction<null | string>> }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onFilterChange = useCallback(() => {
    const input = inputRef.current;
    const value = input?.value;
    setFilter(value || "");
  }, [setFilter]);

  return (
    <InputBase
      ref={ref}
      onFocus={onFilterChange}
      defaultValue={filter || ""}
      sx={{
        width: "100%",
        mx: 1,
        px: 1,
        mb: 0.5,
        height: 30,
        background: "#2c2c2c",
        display: "flex",
        borderRadius: "5px",
        color: "white",
      }}
      inputProps={{
        sx: { p: 0, height: 30, color: theme.colors.white, background: "#2c2c2c", borderRadius: 1 },
        ref: inputRef,
      }}
      onChange={onFilterChange}
      placeholder={`Filter models`}
    />
  );
};
const VirtualizedModelList = ({ models }: { models: ArtistModelOption[] }) => {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const itemContent = (index: number, model: ArtistModelOption) => {
    if (!model) {
      return null;
    }

    return <Model key={model.id} model={model} />;
  };
  return (
    <Virtuoso
      increaseViewportBy={2000}
      style={{ height: "100%", width: "100%" }}
      data={models}
      itemContent={itemContent}
      overscan={100}
      ref={virtuoso}
    />
  );
};

const getTopLevelCategoryFilteredList = (
  models: ArtistModelOption[] | undefined,
  classification: string | undefined,
  favorites: string[],
) => {
  if (!models) {
    return [];
  }

  if (!classification) {
    return models;
  }
  if (classification === ALL_CATEGORY) {
    return models;
  }
  if (classification === FAVORITES_CATEGORY) {
    return models.filter((l) => {
      return favorites?.includes(l.id) || favorites?.includes(path.parse(l.id).name);
    });
  }
  if (classification === DOWNLOADED_CATEGORY) {
    return models.filter((l) => {
      return l.downloaded;
    });
  }

  if (classification === VALIDATED) {
    return models.filter((l) => {
      return l.isHighQuality;
    });
  }
  return models.filter((l) => {
    return l.metadata?.classification?.includes(classification);
  });
};
export const ModelList = () => {
  const [filter, setFilter] = useState<null | string>(null);
  const { data: models } = useModelList();
  const { data: favorites = [] } = useFavorites();
  const voiceModelFilters = useReplay((state) => state.voiceModelFilters);

  const isFavorites = voiceModelFilters.classification === FAVORITES_CATEGORY;
  const categoryFilteredModels = React.useMemo(
    () => getTopLevelCategoryFilteredList(models, voiceModelFilters.classification, favorites || []),
    [favorites, models, voiceModelFilters.classification],
  );
  const modelsToRender = React.useMemo(() => {
    if (!categoryFilteredModels) {
      return [];
    }
    if (filter) {
      const fuse = new Fuse(categoryFilteredModels || [], {
        keys: ["name", "id"],
        threshold: 0.4,
        shouldSort: true,
      });
      const filtered = fuse.search(filter);
      return (filtered || []).map((l) => l.item);
    }
    if (isFavorites) {
      return categoryFilteredModels.sort((a, b) => {
        //keep same order as favorites
        const indexA = favorites?.indexOf(a.name);
        const indexB = favorites?.indexOf(b.name);
        if (indexA === undefined || indexB === undefined) {
          return 0;
        }
        return indexA - indexB;
      });
    }
    return categoryFilteredModels;
  }, [categoryFilteredModels, filter, isFavorites, favorites]);

  return (
    <ModelWrapper>
      <ModelNameFilter setFilter={setFilter} />
      <VirtualizedModelList models={modelsToRender} />
    </ModelWrapper>
  );
};
