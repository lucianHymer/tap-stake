import type React from 'react';
export type IconName =
  | 'pixel/heart'
  | 'pixel/leaf'
  | 'pixel/plant'
  | 'pixel/plus'
  | 'pixel/read'
  | 'pixel/search'
  | 'pixel/skull'
  | 'pixel/sword'
  | 'pixel/wand'
  | 'pixel/web'
  | 'pixel/x'
  | 'glyph/burst'
  | 'glyph/flame'
  | 'glyph/icon-stylized-solid'
  | 'glyph/key'
  | 'glyph/star'
  | 'glyph/sword';
export type IconProps = React.SVGAttributes<SVGSVGElement> & { name: IconName; size?: number };
export const Icon: React.FC<IconProps> = ({ name, size = 16, ...rest }) => {
  const id = name.replace('/', '-');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <use href={`#${id}`} />
    </svg>
  );
};
export default Icon;
