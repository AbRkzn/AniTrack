import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import { useTheme } from '../../constants/themeContext';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export function Icon({ name, size = 20, color, style }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.textSecondary} style={style} />;
}
