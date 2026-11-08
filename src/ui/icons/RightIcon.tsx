import * as React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

const RightIcon = ({ size = 24, color = '#E6E8EE', ...props }: IconProps & SvgProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"
      fill={color}
    />
  </Svg>
);

export default RightIcon;
