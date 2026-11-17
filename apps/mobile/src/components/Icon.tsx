import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName = 'today' | 'plan' | 'train' | 'learn' | 'plus' | 'streak' | 'check' | 'sound' | 'mute' | 'close';

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
    </Svg>
  );
}
