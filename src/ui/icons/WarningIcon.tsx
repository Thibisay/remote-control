import * as React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

const WarningIcon = ({ size = 24, color = '#E6E8EE', ...props }: IconProps & SvgProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
      fill={color}
    />
  </Svg>
);

export default WarningIcon;
