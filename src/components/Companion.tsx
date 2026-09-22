// The companion: LY's egg creature, drawn in SVG line-art.
// Its appearance follows the egg evolution stage from streak.ts:
// 0 empty nest → 1 egg → 2 cracking → 3 hatching → 4 chick →
// 5 fledgling → 6 soaring.

import Svg, { Circle, Ellipse, Path, Polygon } from 'react-native-svg';
import type { EggStage } from '../streak';

const S = 3;

function Nest({ color }: { color: string }) {
  return (
    <>
      <Ellipse
        cx="60"
        cy="92"
        rx="38"
        ry="12"
        stroke={color}
        strokeWidth={S}
        fill="none"
      />
      <Path
        d="M30 88c8 8 18 12 30 12s22-4 30-12"
        stroke={color}
        strokeWidth={S}
        fill="none"
        strokeLinecap="round"
        opacity={0.55}
      />
      <Path
        d="M24 84c-2-4-6-5-9-4M96 84c2-4 6-5 9-4"
        stroke={color}
        strokeWidth={S - 0.8}
        fill="none"
        strokeLinecap="round"
        opacity={0.55}
      />
    </>
  );
}

function EggShell({ color, cracked }: { color: string; cracked?: boolean }) {
  return (
    <>
      <Path
        d="M60 28c16 0 26 16 26 34 0 14-11 24-26 24S34 76 34 62c0-18 10-34 26-34z"
        stroke={color}
        strokeWidth={S}
        fill={color}
        fillOpacity={0.08}
      />
      {cracked ? (
        <Path
          d="M48 52l7 6 6-7 7 6 6-7"
          stroke={color}
          strokeWidth={S - 0.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </>
  );
}

function ChickHead({
  color,
  cx,
  cy,
  r,
  beakOpen,
}: {
  color: string;
  cx: number;
  cy: number;
  r: number;
  beakOpen?: boolean;
}) {
  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={S}
        fill={color}
        fillOpacity={0.08}
      />
      <Circle cx={cx - r * 0.35} cy={cy - r * 0.15} r={r * 0.14} fill={color} />
      <Circle cx={cx + r * 0.35} cy={cy - r * 0.15} r={r * 0.14} fill={color} />
      {beakOpen ? (
        <Polygon
          points={`${cx - r * 0.22},${cy + r * 0.18} ${cx + r * 0.22},${cy + r * 0.18} ${cx},${cy + r * 0.52}`}
          fill={color}
        />
      ) : (
        <Polygon
          points={`${cx - r * 0.18},${cy + r * 0.22} ${cx + r * 0.18},${cy + r * 0.22} ${cx},${cy + r * 0.44}`}
          fill={color}
        />
      )}
      <Path
        d={`M${cx - r * 0.55} ${cy + r * 0.45}c${r * 0.3} ${r * 0.18} ${r * 0.8} ${r * 0.18} ${r * 1.1} 0`}
        stroke={color}
        strokeWidth={S - 1}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
    </>
  );
}

export function Companion({
  stage,
  color,
  size = 120,
}: {
  stage: EggStage;
  color: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {stage === 0 ? (
        <Nest color={color} />
      ) : stage === 1 ? (
        <>
          <Nest color={color} />
          <EggShell color={color} />
        </>
      ) : stage === 2 ? (
        <>
          <Nest color={color} />
          <EggShell color={color} cracked />
        </>
      ) : stage === 3 ? (
        <>
          <Nest color={color} />
          {/* broken bottom shell */}
          <Path
            d="M34 62c0 14 11 24 26 24s26-10 26-24l-8-2-6 5-7-5-6 5-7-5-6 4-6-4z"
            stroke={color}
            strokeWidth={S}
            fill={color}
            fillOpacity={0.08}
            strokeLinejoin="round"
          />
          <ChickHead color={color} cx={60} cy={44} r={15} beakOpen />
          {/* shell cap tipped aside */}
          <Path
            d="M84 78c6-2 10-8 10-14l-12 3z"
            stroke={color}
            strokeWidth={S - 0.8}
            fill="none"
            strokeLinejoin="round"
          />
        </>
      ) : stage === 4 ? (
        <>
          <Nest color={color} />
          {/* body */}
          <Ellipse
            cx="60"
            cy="80"
            rx="20"
            ry="16"
            stroke={color}
            strokeWidth={S}
            fill={color}
            fillOpacity={0.08}
          />
          {/* wing */}
          <Path
            d="M44 78c-6 2-9 7-8 12 4-1 8-5 9-10"
            stroke={color}
            strokeWidth={S - 0.8}
            fill="none"
            strokeLinecap="round"
          />
          <ChickHead color={color} cx={60} cy={52} r={17} />
          {/* feet */}
          <Path
            d="M52 96v4M68 96v4"
            stroke={color}
            strokeWidth={S - 0.8}
            strokeLinecap="round"
          />
        </>
      ) : stage === 5 ? (
        <>
          <Nest color={color} />
          <Ellipse
            cx="60"
            cy="78"
            rx="24"
            ry="19"
            stroke={color}
            strokeWidth={S}
            fill={color}
            fillOpacity={0.08}
          />
          {/* wings */}
          <Path
            d="M38 74c-9 3-14 10-13 18 6-2 12-8 14-15"
            stroke={color}
            strokeWidth={S - 0.6}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M82 74c9 3 14 10 13 18-6-2-12-8-14-15"
            stroke={color}
            strokeWidth={S - 0.6}
            fill="none"
            strokeLinecap="round"
          />
          {/* tail */}
          <Path
            d="M52 95l-4 9M60 96v10M68 95l4 9"
            stroke={color}
            strokeWidth={S - 0.8}
            strokeLinecap="round"
          />
          <ChickHead color={color} cx={60} cy={46} r={18} />
          {/* head tuft */}
          <Path
            d="M60 28c-2-5-6-7-9-8M60 28c0-5 2-9 5-11"
            stroke={color}
            strokeWidth={S - 1}
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* soaring bird — no nest, it's flying */}
          <Path
            d="M20 62c12-14 26-16 40-8 14-8 28-6 40 8-14-4-26-2-40 6-14-8-26-10-40-6z"
            stroke={color}
            strokeWidth={S}
            fill={color}
            fillOpacity={0.08}
            strokeLinejoin="round"
          />
          <Circle cx="60" cy="60" r="11" fill={color} fillOpacity={0.12} stroke={color} strokeWidth={S} />
          <Circle cx="57" cy="58" r="1.8" fill={color} />
          <Polygon points="68,58 76,61 68,64" fill={color} />
          {/* motion arcs */}
          <Path
            d="M30 88c10 6 22 8 34 6M28 98c12 5 26 6 40 4"
            stroke={color}
            strokeWidth={S - 1.2}
            fill="none"
            strokeLinecap="round"
            opacity={0.4}
          />
        </>
      )}
    </Svg>
  );
}
