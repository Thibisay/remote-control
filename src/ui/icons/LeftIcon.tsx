import * as React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

const LeftIcon = ({ size = 24, color = '#E6E8EE', ...props }: IconProps & SvgProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"
      fill={color}
    />
  </Svg>
);

export default LeftIcon;
