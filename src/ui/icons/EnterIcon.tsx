import * as React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

const EnterIcon = ({ size = 24, color = '#E6E8EE', ...props }: IconProps & SvgProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z"
      fill={color}
    />
  </Svg>
);

export default EnterIcon;
