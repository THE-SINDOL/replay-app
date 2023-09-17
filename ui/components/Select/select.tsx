import { baseThemeOptions } from "../theme";
import type { Theme } from "react-select";

const colors = {
  primary: baseThemeOptions.palette.primary.main,
  primary75: "#4C9AFF",
  primary50: "#484848",
  primary25: "#6b6b6b",
  danger: "#DE350B",
  dangerLight: "#FFBDAD",
  neutral90: "hsl(0, 0%, 100%)",
  neutral80: "hsl(0, 0%, 95%)",
  neutral70: "hsl(0, 0%, 90%)",
  neutral60: "hsl(0, 0%, 80%)",
  neutral50: "hsl(0, 0%, 70%)",
  neutral40: "hsl(0, 0%, 60%)",
  neutral30: "hsl(0, 0%, 50%)",
  neutral20: "hsl(0, 0%, 40%)",
  neutral10: "hsl(0, 0%, 30%)",
  neutral5: "hsl(0, 0%, 20%)",
  neutral0: "#383838",
};

const borderRadius = 4;
// Used to calculate consistent margin/padding on elements
const baseUnit = 4;
// The minimum height of the control
const controlHeight = 30;
// The amount of space between the control and menu */
const menuGutter = baseUnit * 2;

export const spacing = {
  baseUnit,
  controlHeight,
  menuGutter,
};

export const selectTheme: Theme = {
  borderRadius,
  colors,
  spacing,
};
