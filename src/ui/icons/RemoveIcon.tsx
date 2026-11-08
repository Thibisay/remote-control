import * as React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

const RemoveIcon = ({ size = 24, color = '#E6E8EE', ...props }: IconProps & SvgProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M19 13H5v-2h14v2z"
      fill={color}
    />
  </Svg>
);

export default RemoveIcon;
