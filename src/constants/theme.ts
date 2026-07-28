import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  light: {
    primary: '#2E7D32',
    primaryLight: '#4CAF50',
    primaryDark: '#1B5E20',
    primaryFaded: '#E8F5E9',
    success: '#66BB6A',
    warning: '#F9A825',
    error: '#D32F2F',
    errorLight: '#FFEBEE',
    background: '#F7F9F4',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F4EF',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#FFFFFF',
    border: '#E0E0E0',
    borderLight: '#EDEDED',
    disabled: '#9E9E9E',
    disabledBackground: '#E0E0E0',
    overlay: 'rgba(0,0,0,0.5)',
    shadow: 'rgba(0,0,0,0.1)',
    cardShadow: 'rgba(0,0,0,0.08)',
    statusGrowing: '#4CAF50',
    statusReady: '#F9A825',
    statusHarvested: '#66BB6A',
    statusFailed: '#D32F2F',
    chartBlue: '#2196F3',
    chartOrange: '#FF9800',
    chartPurple: '#9C27B0',
    chartTeal: '#009688',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  dark: {
    primary: '#4CAF50',
    primaryLight: '#66BB6A',
    primaryDark: '#2E7D32',
    primaryFaded: '#1B5E20',
    success: '#66BB6A',
    warning: '#F9A825',
    error: '#EF5350',
    errorLight: '#4A1C1C',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    textInverse: '#1A1A1A',
    border: '#333333',
    borderLight: '#2A2A2A',
    disabled: '#666666',
    disabledBackground: '#333333',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: 'rgba(0,0,0,0.3)',
    cardShadow: 'rgba(0,0,0,0.2)',
    statusGrowing: '#66BB6A',
    statusReady: '#F9A825',
    statusHarvested: '#81C784',
    statusFailed: '#EF5350',
    chartBlue: '#42A5F5',
    chartOrange: '#FFA726',
    chartPurple: '#AB47BC',
    chartTeal: '#26A69A',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 30,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  tab: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  contentPadding: spacing.lg,
  screenWidth: width,
  screenHeight: height,
  isSmallDevice: width < 375,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  tabBarHeight: 60,
  headerHeight: 56,
  fabSize: 56,
  fabBottom: 24,
  fabRight: 24,
};

export const hitSlop = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
};