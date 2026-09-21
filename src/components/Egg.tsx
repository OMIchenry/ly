import Svg, { Circle, Ellipse, Path, Polyline } from 'react-native-svg';
import type { EggStage } from '../streak';

const EGG_PATH =
  'M50,6 C76,6 90,42 90,64 C90,86 71,100 50,100 C29,100 10,86 10,64 C10,42 24,6 50,6 Z';

/**
 * The streak egg, drawn in monochrome:
 * 0 = dotted outline (no egg yet), 1 = whole egg,
 * 2 = cracking egg, 3 = hatched chick in a broken shell.
 */
export function Egg({
  stage,
  color,
  soft,
  size = 64,
}: {
  stage: EggStage;
  color: string;
  soft: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 106">
      {stage === 0 ? (
        <Path
          d={EGG_PATH}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray="7 7"
          strokeLinecap="round"
          opacity={0.45}
        />
      ) : null}

      {stage === 1 ? (
        <>
          <Path d={EGG_PATH} fill={soft} stroke={color} strokeWidth={3.5} />
          <Ellipse
            cx={36}
            cy={44}
            rx={7}
            ry={12}
            fill={color}
            opacity={0.12}
            transform="rotate(-18 36 44)"
          />
        </>
      ) : null}

      {stage === 2 ? (
        <>
          <Path d={EGG_PATH} fill={soft} stroke={color} strokeWidth={3.5} />
          <Polyline
            points="50,18 41,36 53,50 43,66 55,82"
            fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {stage === 3 ? (
        <>
          {/* chick */}
          <Circle cx={50} cy={40} r={15} fill={soft} stroke={color} strokeWidth={3.5} />
          <Circle cx={44} cy={38} r={2.4} fill={color} />
          <Circle cx={56} cy={38} r={2.4} fill={color} />
          <Path d="M46,45 L54,45 L50,51 Z" fill={color} />
          <Ellipse cx={50} cy={66} rx={19} ry={14} fill={soft} stroke={color} strokeWidth={3.5} />
          {/* broken shell */}
          <Path
            d="M16,76 L26,88 L36,76 L48,90 L60,76 L70,88 L80,76 L84,82 C84,94 68,102 50,102 C32,102 16,94 16,82 Z"
            fill={soft}
            stroke={color}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
        </>
      ) : null}
    </Svg>
  );
}
