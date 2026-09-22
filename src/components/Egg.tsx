import Svg, { Circle, Ellipse, Path, Polyline } from 'react-native-svg';
import type { EggStage } from '../streak';

const EGG_PATH =
  'M50,6 C76,6 90,42 90,64 C90,86 71,100 50,100 C29,100 10,86 10,64 C10,42 24,6 50,6 Z';

/**
 * The streak egg, drawn in monochrome:
 * 0 = dotted outline (no egg yet), 1 = whole egg, 2 = cracking,
 * 3 = hatching, 4 = chick in a broken shell, 5 = fledgling, 6 = soaring.
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
          <Path d={EGG_PATH} fill={soft} stroke={color} strokeWidth={3} />
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
          <Path d={EGG_PATH} fill={soft} stroke={color} strokeWidth={3} />
          <Polyline
            points="50,18 41,36 53,50 43,66 55,82"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {stage === 3 ? (
        <>
          {/* hatching: shell opening with light rays */}
          <Path
            d="M14,58 L26,70 L36,58 L48,72 L60,58 L70,70 L82,58 L86,62 C88,74 86,86 71,98 C62,104 38,104 29,98 C14,86 12,74 14,62 Z"
            fill={soft}
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Polyline
            points="35,44 29,30"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Polyline
            points="50,40 50,24"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Polyline
            points="65,44 71,30"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* beak peeking out */}
          <Path d="M44,56 L56,56 L50,64 Z" fill={color} />
        </>
      ) : null}

      {stage === 4 ? (
        <>
          {/* chick */}
          <Circle cx={50} cy={40} r={15} fill={soft} stroke={color} strokeWidth={3} />
          <Circle cx={44} cy={38} r={2.4} fill={color} />
          <Circle cx={56} cy={38} r={2.4} fill={color} />
          <Path d="M46,45 L54,45 L50,51 Z" fill={color} />
          <Ellipse cx={50} cy={66} rx={19} ry={14} fill={soft} stroke={color} strokeWidth={3} />
          {/* broken shell */}
          <Path
            d="M16,76 L26,88 L36,76 L48,90 L60,76 L70,88 L80,76 L84,82 C84,94 68,102 50,102 C32,102 16,94 16,82 Z"
            fill={soft}
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {stage === 5 ? (
        <>
          {/* fledgling: bigger bird with a wing */}
          <Ellipse
            cx={31}
            cy={62}
            rx={9}
            ry={15}
            fill={soft}
            stroke={color}
            strokeWidth={3}
            transform="rotate(-24 31 62)"
          />
          <Ellipse cx={52} cy={66} rx={23} ry={18} fill={soft} stroke={color} strokeWidth={3} />
          <Circle cx={52} cy={36} r={17} fill={soft} stroke={color} strokeWidth={3} />
          <Circle cx={46} cy={34} r={2.6} fill={color} />
          <Circle cx={58} cy={34} r={2.6} fill={color} />
          <Path d="M47,42 L57,42 L52,49 Z" fill={color} />
          {/* tail feathers */}
          <Polyline
            points="72,72 84,66 82,78"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {stage === 6 ? (
        <>
          {/* soaring: spread wings + motion arcs */}
          <Path
            d="M50,58 C36,44 24,38 10,42 C22,48 30,54 38,62 Z"
            fill={soft}
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d="M50,58 C64,44 76,38 90,42 C78,48 70,54 62,62 Z"
            fill={soft}
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Ellipse cx={50} cy={62} rx={10} ry={14} fill={soft} stroke={color} strokeWidth={3} />
          <Circle cx={50} cy={46} r={8} fill={soft} stroke={color} strokeWidth={3} />
          <Path d="M47,49 L53,49 L50,53 Z" fill={color} />
          <Path
            d="M28,88 C40,94 60,94 72,88"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.5}
          />
          <Path
            d="M36,98 C44,101 56,101 64,98"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.3}
          />
        </>
      ) : null}
    </Svg>
  );
}
