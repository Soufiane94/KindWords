// Draws Wafi's app icon, splash image, widget preview and Play Store
// graphics (9H) as SVG, and turns them into the PNG files the app and the
// store need. The icon has no lettering, so it suits every language.
//
// The rasterizer isn't one of the app's dependencies. To run it:
//   npm install --no-save @resvg/resvg-js
//   node scripts/make-assets.js
//
// The icon, splash and widget preview are built into the app, so changing
// them needs a new EAS build.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const STORE = path.join(ROOT, 'store', 'graphics');
fs.mkdirSync(STORE, { recursive: true });

// Wafi's head in a white speech bubble, on a sky-blue gradient (9O): grey,
// blue and white. It replaced the smiling face of 9K once the pup became
// the app's face. The splash background in app.json is SPLASH_BACKGROUND,
// and the adaptive icon's backgroundColor is gradientBottom.
const COLORS = {
  gradientTop: '#8EC3F0',
  gradientBottom: '#4A86D2',
  bubble: '#FFFFFF',
  shadow: '#24538C',
  fur: '#D6DCE4',
  ears: '#A3AEBC',
  muzzle: '#F7F9FB',
  outline: '#42536A',
  eye: '#28374A',
};
const SPLASH_BACKGROUND = '#FFFFFF';

// The pup's head, from src/components/MascotDrawing.tsx (its 120 x 112
// units, the "smile" face), drawn here with a bolder line and bigger eyes
// so it still reads at launcher size. If the pup's drawing changes there,
// change it here too.
const BEARD = 'Q 77 87 69 86 Q 67 93 60 91 Q 53 93 51 86 Q 43 87 45 79';
const HEAD =
  'M 60 12 C 71 12 80 16 84 24 C 88 31 89 40 88 47 Q 94 51 89 55 Q 93 60 87 63 C 85 69 80 75 75 79 ' +
  BEARD +
  ' C 40 75 35 69 33 63 Q 27 60 31 55 Q 26 51 32 47 C 31 40 32 31 36 24 C 40 16 49 12 60 12 Z';
const MUZZLE =
  `M 75 79 ${BEARD} Q 40 76 44 70 Q 39 66 45 62 C 46 52 52 43 60 43 ` +
  'C 68 43 74 52 75 62 Q 81 66 76 70 Q 80 76 75 79 Z';
const TUFT = 'M 50 15 Q 53 6 58.5 11 Q 62 4 67 12.5 Q 69 13.5 70 15.5';
const EAR = 'M 44 17 C 37 13 29 15 25 21 C 22 26 23 32 26 35 C 28 33 31 29 36 27 Z';
const BROW = 'M 40 31.5 Q 42 26.5 47.5 26 Q 51.5 25.8 54.5 28.5 Q 50.5 28.6 48 30 Q 44 29.8 40 31.5 Z';
const NOSE = 'M 53.5 56 C 53.5 53 66.5 53 66.5 56 C 66.5 59.5 62.5 62 60 62 C 57.5 62 53.5 59.5 53.5 56 Z';
const SMILE = 'M 60 62 L 60 65 M 53 64 Q 56.5 68.5 60 65 Q 63.5 68.5 67 64';
const STROKE = 3.3;

function mirrored(shapes) {
  return `<g transform="matrix(-1 0 0 1 120 0)">${shapes}</g>`;
}

const EYE = '<ellipse cx="47.5" cy="38.5" rx="5.5" ry="6.25"/>';
const EYE_SHINE = '<circle cx="49.6" cy="35.9" r="2"/>';

// The head in color, in its own units.
function pupHead() {
  const ear = `<path d="${EAR}" fill="${COLORS.ears}" stroke="${COLORS.outline}" stroke-width="${STROKE}" stroke-linejoin="round"/>`;
  const face = `<g fill="${COLORS.eye}">${EYE}</g><g fill="#FFFFFF">${EYE_SHINE}</g><path d="${BROW}" fill="${COLORS.ears}"/>`;
  return `
    ${ear}${mirrored(ear)}
    <path d="${HEAD}" fill="${COLORS.fur}"/>
    <path d="${MUZZLE}" fill="${COLORS.muzzle}"/>
    <path d="${HEAD}" fill="none" stroke="${COLORS.outline}" stroke-width="${STROKE}" stroke-linejoin="round"/>
    <path d="${TUFT}" fill="${COLORS.fur}" stroke="${COLORS.outline}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>
    ${face}${mirrored(face)}
    <path d="${NOSE}" fill="${COLORS.eye}"/>
    <ellipse cx="57.4" cy="55.4" rx="1.7" ry="1" fill="#FFFFFF" opacity="0.55"/>
    <path d="${SMILE}" fill="none" stroke="${COLORS.outline}" stroke-width="${STROKE * 0.8}" stroke-linecap="round"/>`;
}

// The head as lines only, in one color, for Android's themed icon: what's
// drawn here is cut out of the bubble.
function pupHeadLines(color) {
  const line = `fill="none" stroke="${color}" stroke-width="${STROKE * 1.2}" stroke-linejoin="round" stroke-linecap="round"`;
  const ear = `<path d="${EAR}" ${line}/>`;
  return `
    ${ear}${mirrored(ear)}
    <path d="${HEAD}" ${line}/>
    <path d="${TUFT}" ${line}/>
    <g fill="${color}">${EYE}${mirrored(EYE)}<path d="${NOSE}"/></g>
    <path d="${SMILE}" ${line}/>`;
}

// The mark: a soft speech bubble with the pup's head in it, in a 1024 box
// around its middle, scaled by `k` (1 = the bubble is 600 wide).
function bubbleShapes(k = 1) {
  const c = 512;
  const w = 600 * k;
  const h = 500 * k;
  const left = c - w / 2;
  const top = c - h / 2 - 40 * k;
  const r = 230 * k;
  // The tail, low on the left, curving out like a gentle comma. A round
  // stroke in the same color softens its tip.
  const tail = [
    `M ${left + 125 * k} ${top + h - 60 * k}`,
    `C ${left + 118 * k} ${top + h + 30 * k} ${left + 88 * k} ${top + h + 78 * k} ${left + 52 * k} ${top + h + 100 * k}`,
    `C ${left + 135 * k} ${top + h + 98 * k} ${left + 210 * k} ${top + h + 62 * k} ${left + 255 * k} ${top + h - 10 * k}`,
    'Z',
  ].join(' ');
  // The head (ears to beard: about 85 units tall, centered on 60, 49.5)
  // fills 80% of the bubble's height, a little below its middle.
  const scale = (h * 0.8) / 85;
  const place = (shapes) =>
    `<g transform="translate(${c} ${top + h / 2 + 8 * k}) scale(${scale}) translate(-60 -49.5)">${shapes}</g>`;
  return {
    body: `<rect x="${left}" y="${top}" width="${w}" height="${h}" rx="${r}" ry="${r}"/>`,
    tail: `<path d="${tail}" stroke-width="${26 * k}" stroke-linejoin="round"/>`,
    place,
  };
}

const gradient = `<linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
  <stop offset="0" stop-color="${COLORS.gradientTop}"/>
  <stop offset="1" stop-color="${COLORS.gradientBottom}"/>
</linearGradient>`;
const softShadow = `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>`;

function mark(k) {
  const m = bubbleShapes(k);
  return `
  <g filter="url(#soft)" fill="${COLORS.shadow}" stroke="${COLORS.shadow}" opacity="0.25" transform="translate(0 ${18 * k})">${m.body}${m.tail}</g>
  <g fill="${COLORS.bubble}" stroke="${COLORS.bubble}">${m.body}${m.tail}</g>
  ${m.place(pupHead())}`;
}

function svg(width, height, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${body}</svg>`;
}

const NUNITO = path.join(ROOT, 'node_modules/@expo-google-fonts/nunito');

// Google Play wants its feature graphic without an alpha channel, which
// resvg always writes, so that one is encoded here as a plain RGB PNG.
function crc32(bytes) {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function rgbPng(width, height, rgba) {
  const rows = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3); // each row starts with filter type 0
    for (let x = 0; x < width; x++) rgba.copy(rows, row + 1 + x * 3, (y * width + x) * 4, (y * width + x) * 4 + 3);
  }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits per channel
  header[9] = 2; // RGB, no alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function render(file, svgText, width, { opaque = false } = {}) {
  const image = new Resvg(svgText, {
    fitTo: { mode: 'width', value: width },
    font: {
      fontFiles: [`${NUNITO}/400Regular/Nunito_400Regular.ttf`, `${NUNITO}/700Bold/Nunito_700Bold.ttf`],
      loadSystemFonts: false,
      defaultFontFamily: 'Nunito',
    },
  }).render();
  fs.writeFileSync(file, opaque ? rgbPng(image.width, image.height, Buffer.from(image.pixels)) : image.asPng());
  console.log('wrote', path.relative(ROOT, file));
}

// The full icon: the mark on the gradient (iOS, the Play Store icon, web).
const fullIcon = svg(1024, 1024, `<rect width="1024" height="1024" fill="url(#bg)"/>${mark(1)}`, gradient + softShadow);
render(path.join(ASSETS, 'icon.png'), fullIcon, 1024);
render(path.join(ASSETS, 'favicon.png'), fullIcon, 48);
render(path.join(STORE, 'play-icon-512.png'), fullIcon, 512);

// Android's adaptive icon: the mark inside the safe zone (the middle 66 of
// 108 units, which every launcher mask keeps), the gradient behind it, and
// a one-color version for themed icons (Android 13+): the bubble with the
// pup's lines, eyes and nose cut out of it.
render(path.join(ASSETS, 'android-icon-foreground.png'), svg(1024, 1024, mark(0.72), softShadow), 512);
render(
  path.join(ASSETS, 'android-icon-background.png'),
  svg(1024, 1024, `<rect width="1024" height="1024" fill="url(#bg)"/>`, gradient),
  512
);
{
  const m = bubbleShapes(0.72);
  render(
    path.join(ASSETS, 'android-icon-monochrome.png'),
    svg(
      1024,
      1024,
      `<mask id="cut"><rect width="1024" height="1024" fill="white"/>${m.place(pupHeadLines('black'))}</mask>
       <g fill="#FFFFFF" stroke="#FFFFFF" mask="url(#cut)">${m.body}${m.tail}</g>`
    ),
    432
  );
}

// Splash: the mark the other way round (a sky-blue bubble with the pup in
// its own colors), so it shows on the white background set in app.json.
// One gradient across bubble and tail together.
{
  const m = bubbleShapes(1);
  const shared = `<linearGradient id="bgu" gradientUnits="userSpaceOnUse" x1="330" y1="220" x2="540" y2="840">
    <stop offset="0" stop-color="${COLORS.gradientTop}"/>
    <stop offset="1" stop-color="${COLORS.gradientBottom}"/>
  </linearGradient>`;
  render(
    path.join(ASSETS, 'splash-icon.png'),
    svg(1024, 1024, `<g fill="url(#bgu)" stroke="url(#bgu)">${m.body}${m.tail}</g>${m.place(pupHead())}`, shared),
    1024
  );
}

// The widget picker's preview: the widget as a new user first sees it, in
// the Simple world (src/widget/KindWordWidget.tsx), about 4x2 cells. Nunito
// stands in for the phone's own font.
{
  const W = 750;
  const H = 330;
  const text = (y, size, color, content, weight = 400) =>
    `<text x="${W / 2}" y="${y}" font-family="Nunito" font-weight="${weight}" font-size="${size}" fill="${color}" text-anchor="middle">${content}</text>`;
  render(
    path.join(ASSETS, 'widget-preview.png'),
    svg(
      W,
      H,
      `<rect width="${W}" height="${H}" rx="64" fill="#FBF6EC"/>
       ${text(66, 32, '#8A8A8A', 'A kind word from Wafi')}
       ${text(150, 46, '#3A3A3A', 'You don’t have to earn rest', 500)}
       ${text(208, 46, '#3A3A3A', 'by finishing everything first.', 500)}
       <g transform="translate(${W / 2 - 78} 278)" fill="none" stroke="#6A6A6A" stroke-width="3.2" stroke-linecap="round">
         <path d="M 9 -12 A 12 12 0 1 0 12 -2"/>
         <path d="M 2 -14 L 10 -12.5 L 8.5 -4.5" stroke-linejoin="round"/>
       </g>
       <text x="${W / 2 + 14}" y="290" font-family="Nunito" font-size="32" fill="#6A6A6A" text-anchor="middle">Another</text>`
    ),
    W
  );
}

// Google Play's feature graphic (1024x500): the mark on the icon's
// gradient, with a few soft lights and glows. No words, so it suits every
// language.
{
  const lights = [[140, 110, 7], [230, 380, 5], [860, 90, 6], [930, 300, 8], [780, 420, 5], [330, 60, 4], [700, 60, 4], [90, 300, 5]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity="0.75"/>`)
    .join('');
  const glows = [[205, 230, 24, 0.3], [835, 190, 30, 0.35], [905, 395, 18, 0.28], [120, 420, 16, 0.25]]
    .map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#EAF4FF" opacity="${o}"/>`)
    .join('');
  render(
    path.join(STORE, 'feature-graphic.png'),
    svg(
      1024,
      500,
      `<rect width="1024" height="500" fill="url(#bg)"/>${lights}${glows}
       <g transform="translate(512 250) scale(0.62) translate(-512 -528)">${mark(1)}</g>`,
      gradient + softShadow
    ),
    1024,
    { opaque: true }
  );
}
