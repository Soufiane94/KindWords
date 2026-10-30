// The mascot: a little wheaten wolfhound peeking over the top edge of the
// quote card, front paws resting on it. Drawn in code like the world
// decorations, in one fixed set of colors that works in every world: the
// beige fur stands out on dark worlds, the warm brown outline on light ones.
// Only the drawing lives here; Mascot picks which face to show.

import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

export type MascotFace = 'smile' | 'joy' | 'tender' | 'peaceful' | 'perky';

// The drawing's own units. The card's top edge runs along EDGE_Y: the head
// and chest stop there, and only the paws hang over it.
const WIDTH = 120;
const HEIGHT = 112;
const EDGE_Y = 100;

// How far the mascot rises above the card's edge when drawn this wide, so a
// screen can leave room for it.
export function mascotPeek(width: number): number {
  return (width * EDGE_Y) / WIDTH;
}

const COLORS = {
  fur: '#EAD7B7',
  shade: '#D3B48A', // ears
  brow: '#C4A075',
  muzzle: '#F8EFE1',
  outline: '#7A5A43',
  eye: '#3A2A20',
  nose: '#4A3427',
  mouth: '#8A4A45',
  tongue: '#E98A8C',
  blush: '#F0A396',
  shine: '#FFFFFF',
};

// What changes from one face to the next.
type FaceParts = {
  eyes: 'open' | 'bright' | 'happy' | 'closed';
  brows: 'neutral' | 'raised' | 'soft' | 'relaxed';
  mouth: 'smile' | 'small' | 'open';
  // Degrees each ear is lifted from hanging (on our left, then our right).
  // Below zero, it hangs lower.
  ears: [number, number];
  // Degrees the head leans, around the neck. Negative leans it to our left.
  tilt: number;
  blush: boolean;
};

const FACES: Record<MascotFace, FaceParts> = {
  smile: { eyes: 'open', brows: 'neutral', mouth: 'smile', ears: [0, 0], tilt: 0, blush: false },
  joy: { eyes: 'happy', brows: 'raised', mouth: 'open', ears: [15, 15], tilt: 0, blush: true },
  tender: { eyes: 'open', brows: 'soft', mouth: 'small', ears: [0, 45], tilt: -9, blush: true },
  peaceful: { eyes: 'closed', brows: 'relaxed', mouth: 'small', ears: [-8, -8], tilt: 4, blush: true },
  perky: { eyes: 'bright', brows: 'raised', mouth: 'open', ears: [72, 72], tilt: 0, blush: false },
};

// The head's outline: a long face with wiry tufts at the cheeks and a
// beard. The beard is shared with the lighter muzzle, so the two meet
// exactly.
const BEARD = 'Q 77 87 69 86 Q 67 93 60 91 Q 53 93 51 86 Q 43 87 45 79';
const HEAD =
  'M 60 12 C 71 12 80 16 84 24 C 88 31 89 40 88 47 Q 94 51 89 55 Q 93 60 87 63 C 85 69 80 75 75 79 ' +
  BEARD +
  ' C 40 75 35 69 33 63 Q 27 60 31 55 Q 26 51 32 47 C 31 40 32 31 36 24 C 40 16 49 12 60 12 Z';
// The muzzle and its moustache: lighter, and scruffy at the sides.
const MUZZLE =
  `M 75 79 ${BEARD} Q 40 76 44 70 Q 39 66 45 62 C 46 52 52 43 60 43 ` +
  'C 68 43 74 52 75 62 Q 81 66 76 70 Q 80 76 75 79 Z';
// A scruffy tuft on top.
const TUFT = 'M 50 15 Q 53 6 58.5 11 Q 62 4 67 12.5 Q 69 13.5 70 15.5';
// A front paw around its own middle, and the lines between its toes.
const PAW = 'M -10 100 C -10 95.5 -5.5 94 0 94 C 5.5 94 10 95.5 10 100 C 10 105 6 108 0 108 C -6 108 -10 105 -10 100 Z';
const TOES = 'M -3.5 107.5 L -3.5 104.5 M 3.5 107.5 L 3.5 104.5';

// The left ear, folded and hanging (a wolfhound's "rose" ear). A lifted ear
// is the same ear, turned up around where it meets the head.
const EAR = 'M 44 17 C 37 13 29 15 25 21 C 22 26 23 32 26 35 C 28 33 31 29 36 27 Z';

// Mirrors whatever is inside it onto the other half of the face.
function Mirrored({ children }: { children: React.ReactNode }) {
  return <G transform={`matrix(-1 0 0 1 ${WIDTH} 0)`}>{children}</G>;
}

function Ear({ lift }: { lift: number }) {
  return (
    <Path
      d={EAR}
      transform={`rotate(${lift} 40 21)`}
      fill={COLORS.shade}
      stroke={COLORS.outline}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
  );
}

// The left eye; the right one is the same, mirrored.
function Eye({ kind }: { kind: FaceParts['eyes'] }) {
  const line = { fill: 'none', stroke: COLORS.eye, strokeWidth: 2.5, strokeLinecap: 'round' as const };
  // Closed and smiling (^), or closed and calm (‿).
  if (kind === 'happy') return <Path d="M 43 40 Q 47.5 33.5 52 40" {...line} />;
  if (kind === 'closed') return <Path d="M 43 37 Q 47.5 42 52 37" {...line} />;
  const big = kind === 'bright';
  return (
    <>
      <Ellipse cx="47.5" cy="38" rx={big ? 4.8 : 4.4} ry={big ? 5.4 : 5} fill={COLORS.eye} />
      <Circle cx="49.1" cy="36" r={big ? 1.8 : 1.5} fill={COLORS.shine} />
      <Circle cx="46.2" cy="40.2" r={big ? 0.95 : 0.75} fill={COLORS.shine} />
    </>
  );
}

// A bushy eyebrow, moved and turned for each face.
const BROW = 'M 40 31.5 Q 42 26.5 47.5 26 Q 51.5 25.8 54.5 28.5 Q 50.5 28.6 48 30 Q 44 29.8 40 31.5 Z';
const BROW_POSES: Record<FaceParts['brows'], string> = {
  neutral: '',
  raised: 'translate(0 -2.5)',
  soft: 'rotate(-14 47 29)',
  relaxed: 'translate(0 -0.5) rotate(-5 47 29)',
};

function Brow({ kind }: { kind: FaceParts['brows'] }) {
  return <Path d={BROW} fill={COLORS.brow} transform={BROW_POSES[kind] || undefined} />;
}

function Mouth({ kind }: { kind: FaceParts['mouth'] }) {
  const line = { fill: 'none', stroke: COLORS.outline, strokeWidth: 1.8, strokeLinecap: 'round' as const };
  if (kind === 'open') {
    return (
      <>
        <Path
          d="M 54.6 66.2 Q 60 78 65.4 66.2 Q 62.7 68.2 60 65.2 Q 57.3 68.2 54.6 66.2 Z"
          fill={COLORS.mouth}
          stroke={COLORS.outline}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path d="M 56.6 71.5 Q 60 68.4 63.4 71.5 Q 63 75.8 60 75.8 Q 57 75.8 56.6 71.5 Z" fill={COLORS.tongue} />
        <Path d="M 60 62 L 60 65.2" {...line} />
      </>
    );
  }
  const small = kind === 'small';
  return (
    <>
      <Path d="M 60 62 L 60 65" {...line} />
      <Path
        d={small ? 'M 55.5 64.5 Q 57.8 67 60 65 Q 62.2 67 64.5 64.5' : 'M 53 64 Q 56.5 68.5 60 65 Q 63.5 68.5 67 64'}
        {...line}
      />
    </>
  );
}

type Props = {
  face: MascotFace;
  width: number;
};

export default function MascotDrawing({ face, width }: Props) {
  const parts = FACES[face];
  return (
    <Svg width={width} height={(width * HEIGHT) / WIDTH} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      {/* The chest, down to the card's edge. Left open at the bottom, so
          the edge itself gets no outline. */}
      <Path
        d="M 29 100 C 29 87 39 79 60 79 C 81 79 91 87 91 100"
        fill={COLORS.fur}
        stroke={COLORS.outline}
        strokeWidth={2.2}
      />

      <G transform={`rotate(${parts.tilt} 60 86)`}>
        <Ear lift={parts.ears[0]} />
        <Mirrored>
          <Ear lift={parts.ears[1]} />
        </Mirrored>

        <Path d={HEAD} fill={COLORS.fur} />
        <Path d={MUZZLE} fill={COLORS.muzzle} />
        <Path d={HEAD} fill="none" stroke={COLORS.outline} strokeWidth={2.2} strokeLinejoin="round" />
        <Path
          d={TUFT}
          fill={COLORS.fur}
          stroke={COLORS.outline}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {parts.blush && (
          <>
            <Ellipse cx="38.5" cy="48" rx="4.5" ry="2.8" fill={COLORS.blush} opacity={0.45} />
            <Ellipse cx="81.5" cy="48" rx="4.5" ry="2.8" fill={COLORS.blush} opacity={0.45} />
          </>
        )}
        <Eye kind={parts.eyes} />
        <Brow kind={parts.brows} />
        <Mirrored>
          <Eye kind={parts.eyes} />
          <Brow kind={parts.brows} />
        </Mirrored>

        <Path
          d="M 53.5 56 C 53.5 53 66.5 53 66.5 56 C 66.5 59.5 62.5 62 60 62 C 57.5 62 53.5 59.5 53.5 56 Z"
          fill={COLORS.nose}
        />
        <Ellipse cx="57.4" cy="55.4" rx="1.7" ry="1" fill={COLORS.shine} opacity={0.55} />
        <Mouth kind={parts.mouth} />
      </G>

      {/* Front paws resting over the card's edge. */}
      {[45, 75].map((x) => (
        <G key={x} transform={`translate(${x} 0)`}>
          <Path d={PAW} fill={COLORS.fur} stroke={COLORS.outline} strokeWidth={2.2} />
          <Path d={TOES} stroke={COLORS.outline} strokeWidth={1.5} strokeLinecap="round" />
        </G>
      ))}
    </Svg>
  );
}
