import Svg, { Path } from 'react-native-svg';
import { iconPaths, type IconName } from './paths';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color = '#E6E8EE' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={iconPaths[name]} fill={color} />
    </Svg>
  );
}

export type { IconName };
