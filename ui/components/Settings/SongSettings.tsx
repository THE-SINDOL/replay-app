import type { AdvancedOptions } from "../../context";
import { useReplay } from "../../context";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { IconButton, InputBase, Slider, Switch } from "@mui/material";
import { Typography } from "@mui/material";
import "./settings.css";
import { Add, Close, Download } from "@mui/icons-material";
import Select from "react-select";
import { selectTheme } from "../Select/select.tsx";
import { groupBy, startCase } from "lodash-es";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import { trpcReact } from "../../config/trpc.ts";
import {
  useDevice,
  useHasDownloadedSelectedStemModel,
  useHasDownloadedSelectedStemModelsList,
  useStemModelList,
} from "../../hooks/dataHooks.ts";
import { toast } from "react-toastify";
import theme from "../theme.ts";
import { useAnalytics } from "../../hooks/useAnalytics.ts";
import { ICON_SIZE } from "../CreateSong/ModelSelector/shared.tsx";
import CircularProgress from "@mui/material/CircularProgress";
type F0Method = NonNullable<AdvancedOptions["f0Method"]>;
type StemMethod = NonNullable<AdvancedOptions["stemmingMethod"]>;
type OutputFormat = NonNullable<AdvancedOptions["outputFormat"]>;
// todo figure out if theres a way to get an array of values from the ts type
interface DropdownOption<T> {
  value: T;
  label: string;
}

const F0Methods = ["pm", "harvest", "crepe", "crepe-tiny", "mangio-crepe", "mangio-crepe-tiny", "rmvpe"] as const;
const F0Options: DropdownOption<F0Method>[] = F0Methods.map((l) => ({
  value: l as F0Method,
  label: startCase(l),
}));

const OutputFormats = ["wav", "mp3_192k", "mp3_320k"];
const OutputOptions: DropdownOption<OutputFormat>[] = OutputFormats.map((l) => ({
  value: l as OutputFormat,
  label: l.replace("_", " "),
}));

const OutputFormatSelector = () => {
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  return (
    <SettingsEntry
      title={"Output Format"}
      description={"Output file type and quality"}
      content={
        <Select<DropdownOption<OutputFormat>>
          theme={selectTheme}
          name={"outputFormat"}
          value={OutputOptions.find((l) => l.value === options.outputFormat)}
          placeholder={"Output Format"}
          blurInputOnSelect
          options={OutputOptions}
          onChange={(value) => {
            if (value) {
              setAdvancedOptions({ ...options, outputFormat: value.value });
            }
          }}
          styles={{
            option: (baseStyles, state) => ({
              ...baseStyles,
              color: state.isSelected ? "white" : baseStyles.color,
            }),
          }}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          onBlur={() => {}}
        />
      }
    />
  );
};

const FZeroMethod = () => {
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  return (
    <SettingsEntry
      title={"F0 Method"}
      description={"Method used to detect pitch"}
      content={
        <Select<DropdownOption<F0Method>>
          theme={selectTheme}
          name={"f0Method"}
          value={F0Options.find((l) => l.value === options.f0Method)}
          placeholder={"F0 Method"}
          blurInputOnSelect
          options={F0Options}
          isDisabled={options.vocalsOnly}
          onChange={(value) => {
            if (value) {
              setAdvancedOptions({ ...options, f0Method: value.value });
            }
          }}
          styles={{
            option: (baseStyles, state) => ({
              ...baseStyles,
              color: state.isSelected ? "white" : baseStyles.color,
            }),
          }}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          onBlur={() => {}}
        />
      }
    />
  );
};

const StemMethodDownloader = () => {
  const options = useReplay((state) => state.options);
  const hasDownloadedStemModel = useHasDownloadedSelectedStemModel();
  const { refetch: refetchModels } = trpcReact.listDownloadedStemModels.useQuery(undefined);
  const logEvent = useAnalytics();
  const { mutateAsync: downloadModel, isLoading: _isDownloading } = trpcReact.downloadStemModel.useMutation();
  const stemmingMethod = options.stemmingMethod;
  const { data: downloadStatus, refetch: refetchModelDownloadStatus } = trpcReact.fetchStemModelDownloadStatus.useQuery(
    stemmingMethod,
    {
      enabled: !hasDownloadedStemModel,
      refetchInterval: hasDownloadedStemModel ? false : 1000,
    },
  );

  const errorString = String(downloadStatus?.error || "");
  const isError = Boolean(errorString);

  const isDownloading = _isDownloading || Boolean(downloadStatus?.progress);
  React.useEffect(() => {
    if (isError && stemmingMethod) {
      toast.error(`Failed to download ${stemmingMethod}: ${errorString}`, {
        toastId: `downloadError-${stemmingMethod}`,
      });
    }
  }, [errorString, isError, stemmingMethod]);

  if (!stemmingMethod || hasDownloadedStemModel) {
    return null;
  }

  const onIconClick = async () => {
    if (!hasDownloadedStemModel) {
      logEvent({ event: "stemModelDownload", metadata: { modelId: stemmingMethod } });
      await downloadModel(stemmingMethod);
      await refetchModelDownloadStatus();
      await refetchModels();
    }
  };

  let currFilePercent = 0;
  if (downloadStatus?.fileCounts) {
    const fileCounts = downloadStatus.fileCounts;
    const { remaining, total } = fileCounts;
    const completed = total - remaining;
    const eachFilePercent = 1 / total;
    currFilePercent += eachFilePercent * completed;
    if (downloadStatus?.progress) {
      const progress = downloadStatus.progress;
      const fileByteCount = progress.total || 1;
      const currentFileDownloadedBytes = progress.loaded || 0;
      if (progress.total) {
        let thisFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);
        thisFilePercent /= eachFilePercent; // if we're downloading 3 files, then we divide it by three
        // but then we add the number we've already completed
        currFilePercent += thisFilePercent;
      }
    }
  }

  const getIcon = () => {
    if (isError) {
      return <Close onClick={onIconClick} color={"error"} sx={{ fontSize: ICON_SIZE, color: theme.colors.error }} />;
    }
    if (isDownloading) {
      return (
        <CircularProgress
          color={"primary"}
          size={ICON_SIZE}
          variant={currFilePercent ? "determinate" : "indeterminate"}
          value={currFilePercent}
        />
      );
    }
    return <Download onClick={onIconClick} sx={{ cursor: "pointer", fontSize: ICON_SIZE }} />;
  };
  return (
    <Box
      sx={{
        px: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {getIcon()}
      </Box>
    </Box>
  );
};

import type { GroupHeadingProps, GroupBase } from "react-select";
import { components } from "react-select";

const groupStyles = {
  color: "white",
  background: theme.colors.slate,
  display: "flex",
  fontSize: 28,
  position: "sticky",
  top: -8,
} as const;
const GroupHeading = (
  props: GroupHeadingProps<DropdownOption<StemMethod>, false, GroupBase<DropdownOption<StemMethod>>>,
) => (
  <div style={groupStyles}>
    <components.GroupHeading {...props} style={{ margin: 0, color: "white" }} />
  </div>
);

const StemmingMethod = () => {
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);
  const hasDownloadedStemModel = useHasDownloadedSelectedStemModel();
  const downloadedModelList = useHasDownloadedSelectedStemModelsList();
  const { data } = useStemModelList();
  const StemOptions: (DropdownOption<StemMethod> & { type: string })[] = (data || []).map((o) => {
    const hasDownloaded = downloadedModelList.find((model) => model.name === o.name);
    return {
      value: o.name,
      label: hasDownloaded ? `✅  ${o.name}` : o.name,
      type: o.type,
    };
  });
  const groupedOptions = Object.entries(groupBy(StemOptions, (option) => option.type)).map(([key, value]) => {
    return {
      label: key,
      options: value as DropdownOption<StemMethod>[],
    };
  });
  return (
    <SettingsEntry
      title={"Stem Method"}
      description={"Method used to stem audio"}
      content={
        <Box sx={{ display: "flex", width: "100%", minWidth: 400 }}>
          <Select<DropdownOption<StemMethod>>
            theme={selectTheme}
            name={"stemMethod"}
            isDisabled={options.preStemmed}
            value={StemOptions.find((l) => l.value === options.stemmingMethod)}
            placeholder={"Stem Method"}
            blurInputOnSelect
            options={groupedOptions}
            onChange={(value) => {
              if (value) {
                setAdvancedOptions({ ...options, stemmingMethod: value.value });
              }
            }}
            styles={{
              option: (baseStyles, state) => ({
                ...baseStyles,
                color: state.isSelected ? "white" : baseStyles.color,
              }),
              container: (base) => ({
                ...base,
                width: "100%",
              }),
            }}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            onBlur={() => {}}
            components={{ GroupHeading }}
          />
          {!hasDownloadedStemModel && <StemMethodDownloader />}
        </Box>
      }
    />
  );
};

const DeviceSelect = () => {
  const { data: devices } = trpcReact.devices.useQuery(undefined, { placeholderData: [] });
  const { mutateAsync: setDevice } = trpcReact.setDevice.useMutation();
  const { data: device, refetch } = useDevice();

  const deviceOptions: DropdownOption<string>[] = (devices || []).map((l) => ({
    value: l,
    label: l.toUpperCase(),
  }));

  return (
    <SettingsEntry
      title={"Device"}
      description={"Device to run the model on. CPU is slowest."}
      content={
        <Select<DropdownOption<string>>
          theme={selectTheme}
          name={"device"}
          value={deviceOptions.find((l) => l.value === device)}
          placeholder={"Device"}
          blurInputOnSelect
          options={deviceOptions}
          onChange={async (value) => {
            if (value) {
              toast.info(`Setting device to ${value.value}`);
              setDevice(value.value);
              await refetch();
              toast.success(`Set device to ${value.value}`);
            }
          }}
          styles={{
            option: (baseStyles, state) => ({
              ...baseStyles,
              color: state.isSelected ? "white" : baseStyles.color,
            }),
          }}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          onBlur={() => {}}
        />
      }
    />
  );
};

const SettingsSection = ({ children }: React.PropsWithChildren) => {
  return <Box sx={{ display: "flex", flexDirection: "row", gap: 8, width: "100%", py: 0.5 }}>{children}</Box>;
};
const SettingsItem = ({ children }: React.PropsWithChildren) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </Box>
  );
};
const SettingsOptionsWrapper = ({ children }: React.PropsWithChildren) => {
  return <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "100%" }}>{children}</Box>;
};
const SettingsContent = ({ children }: React.PropsWithChildren) => {
  return <Box sx={{ width: "100%" }}>{children}</Box>;
};

const SettingsEntry = ({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: React.ReactNode;
}) => {
  return (
    <SettingsItem>
      <SettingsContent>
        <Typography>{title}</Typography>
        <Typography variant="body2" sx={{ color: "#646464", fontSize: "12px" }}>
          {description}
        </Typography>
      </SettingsContent>
      <SettingsContent>{content}</SettingsContent>
    </SettingsItem>
  );
};
const AdvancedSettings = () => {
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);
  const options = useReplay((state) => state.options);

  const [isExpanded, setIsExpanded] = useState(false);
  const handleSettingsClick = (d: React.MouseEvent) => {
    d.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  const ExpandIcon = isExpanded ? ExpandLess : ExpandMoreIcon;
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2c2c2c",
        borderRadius: "12px",
        height: "100%",
        pt: 2,
      }}
    >
      <Typography
        sx={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", py: 1 }}
        onClick={handleSettingsClick}
      >
        Advanced Settings
        <ExpandIcon />
      </Typography>
      {isExpanded && (
        <>
          <SettingsOptionsWrapper>
            <SettingsSection>
              <SettingsEntry
                title={"Index Ratio"}
                description={
                  "The ratio of features from the model vs. the input audio. Higher values will maintain model attributes better."
                }
                content={
                  <Slider
                    value={options.indexRatio || 0.75}
                    min={0}
                    max={1}
                    step={0.05}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, value) =>
                      setAdvancedOptions({ ...options, indexRatio: Array.isArray(value) ? value[0] : value })
                    }
                  />
                }
              />
              <SettingsEntry
                title={"Consonant Protection"}
                description={
                  "Can reduce artifact at lower volumes. Low values mean more protection, 0.5 means no protection."
                }
                content={
                  <Slider
                    value={options.consonantProtection || 0.35}
                    min={0}
                    max={0.5}
                    step={0.05}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, value) =>
                      setAdvancedOptions({ ...options, consonantProtection: Array.isArray(value) ? value[0] : value })
                    }
                  />
                }
              />
            </SettingsSection>
            <SettingsSection>
              <SettingsEntry
                title={"Volume Envelope"}
                description={
                  "Scales the volume of the output audio to match the input audio. Lower values match closer to the input audio. A value of 1 is effectively 'off', no audio scaling will be applied (default)."
                }
                content={
                  <Slider
                    value={options.volumeEnvelope || 1.0}
                    min={0}
                    max={1.0}
                    step={0.05}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, value) =>
                      setAdvancedOptions({ ...options, volumeEnvelope: Array.isArray(value) ? value[0] : value })
                    }
                  />
                }
              />
            </SettingsSection>
            <SettingsSection>
              <DeviceSelect />
              <OutputFormatSelector />
            </SettingsSection>
          </SettingsOptionsWrapper>
        </>
      )}
    </Box>
  );
};
export const SongSettings = () => {
  const options = useReplay((state) => state.options);
  const setModelId = useReplay((state) => state.setModelId);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSettingsClick = (d: React.MouseEvent) => {
    d.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2c2c2c",
          borderRadius: "12px",
          height: "100%",
          maxHeight: isExpanded ? 9999 : "40px",
          transition: "max-height 0.2s ease-in-out",
          p: 2,
          pr: isExpanded ? 6 : 0,
          cursor: isExpanded ? undefined : "pointer",
        }}
        onClick={isExpanded ? undefined : handleSettingsClick}
      >
        {!isExpanded && <Typography>Settings</Typography>}
        {isExpanded && (
          <>
            <SettingsOptionsWrapper>
              <SettingsSection>
                <SettingsEntry
                  title={"Stem Only"}
                  description={"Skip voice conversion and output vocals only"}
                  content={
                    <Switch
                      checked={options.vocalsOnly}
                      onChange={(e) => {
                        const vocalsOnly = e.target.checked;
                        if (vocalsOnly) {
                          setModelId(null);
                        }
                        setAdvancedOptions({
                          ...options,
                          vocalsOnly,
                          preStemmed: vocalsOnly ? false : options.preStemmed,
                        });
                      }}
                    />
                  }
                />
                <SettingsEntry
                  title={"Pre-Stemmed"}
                  description={"Select if input audio is already a vocal track without instrumentals"}
                  content={
                    <Switch
                      checked={Boolean(options.preStemmed)}
                      onChange={(e) => {
                        const preStemmed = e.target.checked;
                        setAdvancedOptions({
                          ...options,
                          preStemmed,
                          vocalsOnly: preStemmed ? false : options.vocalsOnly,
                        });
                      }}
                    />
                  }
                />
              </SettingsSection>
              <SettingsSection>
                <SettingsEntry
                  title={"Sample Mode"}
                  description={"Only use the first 30 seconds of the input audio"}
                  content={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Switch
                        checked={options.sampleMode}
                        onChange={(e) => setAdvancedOptions({ ...options, sampleMode: e.target.checked })}
                      />
                      {options.sampleMode && (
                        <InputBase
                          defaultValue={options.sampleModeStartTime}
                          sx={{
                            width: 150,
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
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                            type: "number",
                          }}
                          onChange={(e) => {
                            const sampleModeStartTime = Number(e.target.value);
                            if (!Number.isNaN(sampleModeStartTime) && sampleModeStartTime > 0) {
                              setAdvancedOptions({ ...options, sampleModeStartTime });
                            }
                          }}
                          placeholder={`Start Time (s)`}
                        />
                      )}
                    </Box>
                  }
                />
                <SettingsEntry
                  title={"De Echo & Reverb"}
                  description={"Remove the echo and reverb from the vocals track."}
                  content={
                    <Switch
                      checked={Boolean(options.deEchoDeReverb)}
                      onChange={(e) => {
                        const deEchoDeReverb = e.target.checked;
                        setAdvancedOptions({
                          ...options,
                          deEchoDeReverb,
                        });
                      }}
                    />
                  }
                />
              </SettingsSection>
              <SettingsSection>
                <SettingsEntry
                  title={"Relative Pitch"}
                  description={"Adjusts input pitch. E.g. for male-to-female, +10 will be close"}
                  content={
                    <Slider
                      value={options.pitch || 0}
                      min={-30}
                      max={30}
                      disabled={options.vocalsOnly}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) =>
                        setAdvancedOptions({ ...options, pitch: Array.isArray(value) ? value[0] : value })
                      }
                    />
                  }
                />
                <SettingsEntry
                  title={"Instrumental Pitch"}
                  description={
                    "Adjusts pitch of the non vocals track. Useful when the instrumental track sounds weird due to changing pitch of vocals track"
                  }
                  content={
                    <Slider
                      value={options.instrumentalsPitch || 0}
                      min={-30}
                      max={30}
                      disabled={options.vocalsOnly}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(e, value) =>
                        setAdvancedOptions({ ...options, instrumentalsPitch: Array.isArray(value) ? value[0] : value })
                      }
                    />
                  }
                />
              </SettingsSection>
              <SettingsSection>
                <StemmingMethod />
              </SettingsSection>
              <SettingsSection>
                <FZeroMethod />
              </SettingsSection>
            </SettingsOptionsWrapper>
            <AdvancedSettings />
          </>
        )}
        <Box sx={{ position: "absolute", right: "0px", mr: 1 }}>
          <IconButton onClick={handleSettingsClick}>
            {isExpanded ? <Close color="disabled" /> : <Add color="disabled" />}
          </IconButton>
        </Box>
      </Box>
    </>
  );
};
