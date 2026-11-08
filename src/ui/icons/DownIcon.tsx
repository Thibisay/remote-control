import * as React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

const DownIcon = ({ size = 24, color = '#E6E8EE', ...props }: IconProps & SvgProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"
      fill={color}
    />
  </Svg>
);

export default DownIcon;
