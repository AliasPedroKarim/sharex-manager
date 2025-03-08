"use client";

import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type ColorVars = {
  background: string;
  foreground: string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  radius: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
};

type ThemeConfig = {
  theme: string;
  cssVars: {
    light: ColorVars;
    dark: ColorVars;
  };
};

const defaultConfig: ThemeConfig = {
  theme: "default",
  cssVars: {
    light: {
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      primary: "346.8 77.2% 49.8%",
      "primary-foreground": "355.7 100% 97.3%",
      secondary: "240 4.8% 95.9%",
      "secondary-foreground": "240 5.9% 10%",
      muted: "240 4.8% 95.9%",
      "muted-foreground": "240 3.8% 46.1%",
      accent: "240 4.8% 95.9%",
      "accent-foreground": "240 5.9% 10%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "0 0% 98%",
      border: "240 5.9% 90%",
      input: "240 5.9% 90%",
      ring: "346.8 77.2% 49.8%",
      radius: "0.5",
      card: "0 0% 100%",
      "card-foreground": "240 10% 3.9%",
      popover: "0 0% 100%",
      "popover-foreground": "240 10% 3.9%",
    },
    dark: {
      background: "20 14.3% 4.1%",
      foreground: "0 0% 95%",
      primary: "346.8 77.2% 49.8%",
      "primary-foreground": "355.7 100% 97.3%",
      secondary: "240 3.7% 15.9%",
      "secondary-foreground": "0 0% 98%",
      muted: "0 0% 15%",
      "muted-foreground": "240 5% 64.9%",
      accent: "12 6.5% 15.1%",
      "accent-foreground": "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      "destructive-foreground": "0 85.7% 97.3%",
      border: "240 3.7% 15.9%",
      input: "240 3.7% 15.9%",
      ring: "346.8 77.2% 49.8%",
      radius: "0.5",
      card: "24 9.8% 10%",
      "card-foreground": "0 0% 95%",
      popover: "0 0% 9%",
      "popover-foreground": "0 0% 95%",
    },
  },
};

const themeConfigAtom = atomWithStorage<ThemeConfig>(
  "theme-config",
  defaultConfig
);

export function useThemeConfig() {
  return useAtom(themeConfigAtom);
}
