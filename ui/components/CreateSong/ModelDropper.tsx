import { trpcReact } from "../../config/trpc.ts";
import { useReplay } from "../../context.tsx";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";
import { DropContainer } from "./SongSelector.tsx";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { CloudUploadRounded } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { useModelList } from "../../hooks/dataHooks.ts";
import { Item, Menu, useContextMenu } from "react-contexify";

export const ModelDropper = () => {
  const { mutateAsync, isLoading } = trpcReact.loadLocalModel.useMutation();
  const { refetch: refetchModels } = useModelList();
  const setModelId = useReplay((state) => state.setModelId);

  const onDrop = async (acceptedFiles: { path: string }[]) => {
    if (isLoading || !acceptedFiles.length) {
      return;
    }
    // Do something with the files
    let selectedPath = acceptedFiles[0].path;
    const isZip = selectedPath.endsWith(".zip");
    if (!isZip) {
      const pth = acceptedFiles.find((l) => l.path.endsWith("pth"));
      if (!pth) {
        toast.error("No pth file found in selection");
        return;
      }
      selectedPath = pth.path;
    }
    try {
      const newModel = await mutateAsync(selectedPath);
      await refetchModels();
      if (newModel) {
        toast.success(`Successfully added ${newModel.name}`);
        setModelId(newModel.id);
      }
    } catch (e: any) {
      toast.error(`Failed to add model: ${e?.message || e}`);
    }
  };
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    useFsAccessApi: false,
    multiple: true,
  });

  const MENU_ID = `model-dropper-menu`;

  const { show } = useContextMenu({
    id: MENU_ID,
  });

  function handleContextMenu(event: any) {
    show({ event });
  }

  return (
    <>
      <DropContainer
        {...(getRootProps({ isFocused, isDragAccept, isDragReject }) as any)}
        onContextMenu={handleContextMenu}
      >
        {/* @ts-ignore */}
        <input {...getInputProps()} type="file" />
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: "4px", gap: "2px" }}>
          {isLoading ? <CircularProgress color={"primary"} /> : <CloudUploadRounded fontSize="large" />}
          <Typography sx={{ whiteSpace: "pre" }} variant={"body2"}>
            Select an artist from the list or drop a custom RVC model
          </Typography>
        </Box>
      </DropContainer>
      <Menu id={MENU_ID}>
        <Item
          onClick={async () => {
            // batch import
            const input = document.createElement("input");
            input.type = "file";
            input.webkitdirectory = true;

            input.onchange = async (e) => {
              const target = e.target as HTMLInputElement;
              const files = target!.files;
              if (files) {
                // we want to find the highest common shared folder of this filelist
                // so we can import all the models in the same folder
                const paths = Array.from(files).map((f) => f.path);
                const zipOrPth = paths.filter((p) => p.endsWith(".pth") || p.endsWith(".zip"));
                const pathSep = zipOrPth[0].includes("/") ? "/" : "\\";
                const commonPath =
                  zipOrPth.reduce((acc, path) => {
                    const split = path.split(pathSep);
                    const accSplit = acc.split(pathSep);
                    const common = split.filter((p, i) => p === accSplit[i]);
                    return common.join(pathSep);
                  }, zipOrPth[0]) + pathSep;
                const pathsWithoutCommon = zipOrPth.map((p) => p.replace(commonPath, ""));
                const rootFiles: string[] = [];
                const groupedByFirstDir = pathsWithoutCommon.reduce(
                  (acc, path) => {
                    if (!path.includes(pathSep)) {
                      rootFiles.push(path);
                      return acc;
                    }
                    const split = path.split(pathSep);
                    const firstDir = split[0];
                    if (!acc[firstDir]) {
                      acc[firstDir] = [];
                    }
                    acc[firstDir].push(path);
                    return acc;
                  },
                  {} as Record<string, string[]>,
                );
                console.log(groupedByFirstDir);
                toast.info(`Starting batch import`);
                for (const [firstDir, paths] of Object.entries(groupedByFirstDir)) {
                  toast.info(`Importing from ${firstDir}`);
                  const joinedPaths = paths.map((p) => commonPath + p);
                  const acceptedFiles = joinedPaths.map((p) => {
                    return { path: p };
                  });
                  await onDrop(acceptedFiles);
                }
                for (const file of rootFiles) {
                  toast.info(`Importing from ${file}`);
                  const joinedPaths = [commonPath + file];
                  const acceptedFiles = joinedPaths.map((p) => {
                    return { path: p };
                  });
                  await onDrop(acceptedFiles);
                  // now we want to find the next highest directory
                }
              }
            };

            input.click();
          }}
        >
          Batch Import
        </Item>
      </Menu>
    </>
  );
};
