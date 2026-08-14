import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { PropsWithChildren, createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

export const brandColors = {
  blue: '#1689ED',
  navy: '#071A3D',
  orange: '#FC6608',
};

type ThemeColors = {
  background: string;
  card: string;
  primary: string;
  text: string;
  textMuted: string;
};

export type AppTheme = {
  colors: ThemeColors;
  isDark: boolean;
  navigation: Theme;
};

const createNavigationTheme = (isDark: boolean, colors: ThemeColors): Theme => {
  const baseTheme = isDark ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.card,
      primary: colors.primary,
      text: colors.text,
    },
  };
};

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primary: brandColors.blue,
  text: brandColors.navy,
  textMuted: '#64748B',
};

const darkColors: ThemeColors = {
  background: '#07101F',
  card: '#0E1D35',
  primary: '#42A5F5',
  text: '#F8FAFC',
  textMuted: '#A8B4C7',
};

export const lightTheme: AppTheme = {
  colors: lightColors,
  isDark: false,
  navigation: createNavigationTheme(false, lightColors),
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  isDark: true,
  navigation: createNavigationTheme(true, darkColors),
};

const ThemeContext = createContext<AppTheme>(lightTheme);

export function ThemeProvider({ children }: PropsWithChildren) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
