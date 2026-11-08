import * as React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

const AddIcon = ({ size = 24, color = '#E6E8EE', ...props }: IconProps & SvgProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
      fill={color}
    />
  </Svg>
);

export default AddIcon;
