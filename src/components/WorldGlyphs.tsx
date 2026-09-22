// Miniature line-art glyphs for the 24 world objects.
// Each draws in a 24×24 box, stroke-only, monochrome — they sit as
// furniture inside the illustrated companion room.

import { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

const S = 1.7; // stroke width

function Glyph({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const GLYPHS: Record<string, (color: string) => React.ReactNode> = {
  coffee: (c) => (
    <Glyph>
      <Path d="M6 9h11v5a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V9z" stroke={c} strokeWidth={S} fill="none" />
      <Path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" stroke={c} strokeWidth={S} fill="none" />
      <Line x1="9.5" y1="4" x2="9.5" y2="6.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="13" y1="3.5" x2="13" y2="6" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  book: (c) => (
    <Glyph>
      <Rect x="6" y="4" width="12" height="16" rx="1.5" stroke={c} strokeWidth={S} fill="none" />
      <Line x1="9.5" y1="4" x2="9.5" y2="20" stroke={c} strokeWidth={S} />
      <Line x1="12.5" y1="9" x2="15.5" y2="9" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="12.5" y1="12.5" x2="15.5" y2="12.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  dumbbell: (c) => (
    <Glyph>
      <Line x1="4" y1="12" x2="20" y2="12" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="6.5" y1="7.5" x2="6.5" y2="16.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="9.5" y1="9" x2="9.5" y2="15" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="17.5" y1="7.5" x2="17.5" y2="16.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="14.5" y1="9" x2="14.5" y2="15" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  backpack: (c) => (
    <Glyph>
      <Rect x="7" y="6" width="10" height="13" rx="4" stroke={c} strokeWidth={S} fill="none" />
      <Rect x="9.5" y="11.5" width="5" height="5" rx="1.5" stroke={c} strokeWidth={S} fill="none" />
      <Path d="M7 9C5 10 4.5 13 4.5 15M17 9c2 1 2.5 4 2.5 6" stroke={c} strokeWidth={S} fill="none" strokeLinecap="round" />
    </Glyph>
  ),
  airplane: (c) => (
    <Glyph>
      <Polygon
        points="12,3 14,10 21,12 14,13 12.8,20 11.5,13.5 4,15 10,11.5 11,3"
        stroke={c}
        strokeWidth={S}
        fill="none"
        strokeLinejoin="round"
      />
    </Glyph>
  ),
  camera: (c) => (
    <Glyph>
      <Rect x="4" y="8" width="16" height="11" rx="2.5" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="12" cy="13.5" r="3.4" stroke={c} strokeWidth={S} fill="none" />
      <Path d="M9 8l1-2.5h4L15 8" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
      <Circle cx="17.5" cy="11" r="0.9" fill={c} />
    </Glyph>
  ),
  music: (c) => (
    <Glyph>
      <Circle cx="12" cy="12" r="8" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="12" cy="12" r="2.4" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="12" cy="12" r="5.4" stroke={c} strokeWidth={1.1} fill="none" opacity={0.5} />
    </Glyph>
  ),
  pizza: (c) => (
    <Glyph>
      <Polygon points="5,5 19,5 12,20" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
      <Circle cx="11" cy="9" r="1.2" fill={c} />
      <Circle cx="13.8" cy="12.5" r="1.2" fill={c} />
      <Circle cx="10.5" cy="14.5" r="1.2" fill={c} />
    </Glyph>
  ),
  controller: (c) => (
    <Glyph>
      <Rect x="4" y="8" width="16" height="9.5" rx="4.75" stroke={c} strokeWidth={S} fill="none" />
      <Line x1="8.5" y1="11" x2="8.5" y2="14.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="6.8" y1="12.75" x2="10.2" y2="12.75" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Circle cx="15" cy="11.6" r="1" fill={c} />
      <Circle cx="17" cy="13.8" r="1" fill={c} />
    </Glyph>
  ),
  moon: (c) => (
    <Glyph>
      <Path
        d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5z"
        stroke={c}
        strokeWidth={S}
        fill="none"
        strokeLinejoin="round"
      />
    </Glyph>
  ),
  tent: (c) => (
    <Glyph>
      <Polygon points="12,4 21,20 3,20" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
      <Polyline points="12,12 9,20 15,20" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
    </Glyph>
  ),
  beach: (c) => (
    <Glyph>
      <Path d="M4 10a8 8 0 0 1 16 0z" stroke={c} strokeWidth={S} fill="none" />
      <Line x1="12" y1="10" x2="12" y2="21" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="12" y1="4" x2="12" y2="7" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  snow: (c) => (
    <Glyph>
      <Line x1="12" y1="4" x2="12" y2="20" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="5" y1="8" x2="19" y2="16" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Line x1="19" y1="8" x2="5" y2="16" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  flower: (c) => (
    <Glyph>
      <Circle cx="12" cy="9" r="2" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="12" cy="4.6" r="1.8" stroke={c} strokeWidth={1.3} fill="none" />
      <Circle cx="16" cy="9" r="1.8" stroke={c} strokeWidth={1.3} fill="none" />
      <Circle cx="8" cy="9" r="1.8" stroke={c} strokeWidth={1.3} fill="none" />
      <Line x1="12" y1="13" x2="12" y2="21" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  briefcase: (c) => (
    <Glyph>
      <Rect x="4" y="8" width="16" height="11" rx="2" stroke={c} strokeWidth={S} fill="none" />
      <Path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" stroke={c} strokeWidth={S} fill="none" />
      <Line x1="12" y1="12" x2="12" y2="15" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  gift: (c) => (
    <Glyph>
      <Rect x="5" y="10" width="14" height="10" rx="1.5" stroke={c} strokeWidth={S} fill="none" />
      <Line x1="12" y1="10" x2="12" y2="20" stroke={c} strokeWidth={S} />
      <Path d="M12 10c-3 0-5-1.5-5-3.5C7 5 8.5 4.5 9.5 5.5 10.5 6.5 12 10 12 10zm0 0c3 0 5-1.5 5-3.5 0-1.5-1.5-2-2.5-1C13.5 6.5 12 10 12 10z" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
    </Glyph>
  ),
  film: (c) => (
    <Glyph>
      <Rect x="4" y="6" width="16" height="12" rx="2" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="8.5" cy="10" r="1.1" fill={c} />
      <Circle cx="15.5" cy="10" r="1.1" fill={c} />
      <Circle cx="8.5" cy="14.5" r="1.1" fill={c} />
      <Circle cx="15.5" cy="14.5" r="1.1" fill={c} />
    </Glyph>
  ),
  dollar: (c) => (
    <Glyph>
      <Circle cx="12" cy="12" r="7.5" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="12" cy="12" r="4.5" stroke={c} strokeWidth={1.2} fill="none" opacity={0.6} />
      <Line x1="12" y1="8.5" x2="12" y2="15.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  heart: (c) => (
    <Glyph>
      <Path
        d="M12 20S4.5 15.5 4.5 9.8A4.3 4.3 0 0 1 8.8 5.5c1.6 0 2.7.9 3.2 2 .5-1.1 1.6-2 3.2-2a4.3 4.3 0 0 1 4.3 4.3C19.5 15.5 12 20 12 20z"
        stroke={c}
        strokeWidth={S}
        fill="none"
        strokeLinejoin="round"
      />
    </Glyph>
  ),
  bike: (c) => (
    <Glyph>
      <Circle cx="6.5" cy="16" r="3.5" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="17.5" cy="16" r="3.5" stroke={c} strokeWidth={S} fill="none" />
      <Polyline points="6.5,16 10.5,9.5 14.5,9.5 17.5,16 10.5,9.5 9,6.5 12,6.5" stroke={c} strokeWidth={S} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Glyph>
  ),
  paw: (c) => (
    <Glyph>
      <Ellipse cx="12" cy="15" rx="4.2" ry="3.4" stroke={c} strokeWidth={S} fill="none" />
      <Circle cx="6.8" cy="10.5" r="1.6" fill={c} />
      <Circle cx="10" cy="7.8" r="1.6" fill={c} />
      <Circle cx="14" cy="7.8" r="1.6" fill={c} />
      <Circle cx="17.2" cy="10.5" r="1.6" fill={c} />
    </Glyph>
  ),
  grad: (c) => (
    <Glyph>
      <Polygon points="12,4 21,8.5 12,13 3,8.5" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
      <Polyline points="6.5,10.5 6.5,15 12,17.8 17.5,15 17.5,10.5" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
      <Line x1="17.5" y1="10.5" x2="17.5" y2="16" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  code: (c) => (
    <Glyph>
      <Rect x="4" y="5" width="16" height="14" rx="2.5" stroke={c} strokeWidth={S} fill="none" />
      <Polyline points="8,10 10.5,12 8,14" stroke={c} strokeWidth={S} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12.5" y1="14.5" x2="16.5" y2="14.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
    </Glyph>
  ),
  tea: (c) => (
    <Glyph>
      <Path d="M5 11h13v3.5A6.5 6.5 0 0 1 11.5 21h-0A6.5 6.5 0 0 1 5 14.5V11z" stroke={c} strokeWidth={S} fill="none" strokeLinejoin="round" />
      <Path d="M18 12h1a2.8 2.8 0 0 1 0 5.6h-1.2" stroke={c} strokeWidth={S} fill="none" strokeLinecap="round" />
      <Line x1="11.5" y1="4" x2="11.5" y2="7.5" stroke={c} strokeWidth={S} strokeLinecap="round" />
      <Path d="M9.5 4.5c.8-.8 3.2-.8 4 0" stroke={c} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </Glyph>
  ),
};

/** Render the glyph for a world object id. Falls back to a dot. */
export function WorldObjectGlyph({
  id,
  color,
}: {
  id: string;
  color: string;
}) {
  const draw = GLYPHS[id];
  if (!draw) return <Circle cx="12" cy="12" r="3" fill={color} />;
  return <>{draw(color)}</>;
}
