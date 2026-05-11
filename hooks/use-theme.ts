import { darkTheme, lightTheme, type Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns the active LockBox `Theme` (light or dark) based on the device color
 * scheme. Use this in screens and components instead of branching on
 * `useColorScheme()` and hardcoding colors.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
