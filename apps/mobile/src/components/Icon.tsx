import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'today'
  | 'plan'
  | 'train'
  | 'learn'
  | 'plus'
  | 'minus'
  | 'streak'
  | 'check'
  | 'sound'
  | 'mute'
  | 'close'
  | 'camera'
  | 'barcode'
  | 'edit'
  | 'search'
  | 'lock'
  | 'spark'
  | 'back'
  | 'image'
  | 'flash';

/** Íconos de trazo propio (24×24, línea 1.75, terminaciones rectas): sustituyen a los emojis de la interfaz. */
export function Icon({ name, size = 22, color, stroke = 1.75 }: { name: IconName; size?: number; color: string; stroke?: number }) {
  const p = { stroke: color, strokeWidth: stroke, fill: 'none', strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'today' && (
        <>
          <Circle cx={12} cy={12} r={8.25} {...p} />
          <Path d="M12 7.5V12l3 2" {...p} />
        </>
      )}
      {name === 'plan' && (
        <>
          <Rect x={4.5} y={4} width={15} height={16.5} {...p} />
          <Path d="M8 9h8M8 12.5h8M8 16h5" {...p} />
        </>
      )}
      {name === 'train' && <Path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12" {...p} />}
      {name === 'learn' && (
        <>
          <Path d="M4 5.5h6.5a1.5 1.5 0 0 1 1.5 1.5v12.5a1.5 1.5 0 0 0-1.5-1.5H4z" {...p} />
          <Path d="M20 5.5h-6.5A1.5 1.5 0 0 0 12 7v12.5a1.5 1.5 0 0 1 1.5-1.5H20z" {...p} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'streak' && <Path d="M12 3.5c.5 3-3.5 5-3.5 9a3.5 3.5 0 0 0 7 0c0-1.6-.8-2.7-1.5-3.5.1 1.4-.6 2.3-1.3 2.5.6-3-.2-5.8-.7-8z" {...p} strokeLinejoin="round" />}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {(name === 'sound' || name === 'mute') && <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {...p} />}
      {name === 'sound' && <Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...p} />}
      {name === 'mute' && <Path d="M15.5 9.5l5 5M20.5 9.5l-5 5" {...p} />}
      {name === 'close' && <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...p} />}
      {name === 'minus' && <Path d="M5 12h14" {...p} />}
      {name === 'camera' && (
        <>
          <Path d="M3.5 8h4l1.5-2.5h6L16.5 8h4v11h-17z" {...p} />
          <Circle cx={12} cy={13.25} r={3.5} {...p} />
        </>
      )}
      {name === 'barcode' && <Path d="M4 5v14M7 5v14M10.5 5v14M13 5v14M16.5 5v14M20 5v14M3 3.5h3M18 3.5h3M3 20.5h3M18 20.5h3" {...p} strokeWidth={stroke * 0.9} />}
      {name === 'edit' && <Path d="M5 19l1-4.5L15.5 5l3.5 3.5L9.5 18zM13.5 7l3.5 3.5M4 21h16" {...p} />}
      {name === 'search' && <Path d="M10.5 4.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM15 15l5 5" {...p} />}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10.5} width={14} height={10} {...p} />
          <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" {...p} />
        </>
      )}
      {name === 'spark' && <Path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9zM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" {...p} strokeLinejoin="round" />}
      {name === 'back' && <Path d="M14.5 5.5L8 12l6.5 6.5" {...p} />}
      {name === 'image' && (
        <>
          <Rect x={3.5} y={5} width={17} height={14} {...p} />
          <Circle cx={9} cy={10} r={1.6} {...p} />
          <Path d="M3.5 16.5l5-4.5 4 3.5 3-2.5 5 4" {...p} />
        </>
      )}
      {name === 'flash' && <Path d="M13.5 3L6 13.5h5.5L10.5 21 18 10.5h-5.5z" {...p} />}
    </Svg>
  );
}
