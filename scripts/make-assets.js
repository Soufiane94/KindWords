// Draws Kindwords' app icon, splash image, widget preview and Play Store
// graphics (9H) as SVG, and turns them into the PNG files the app and the
// store need. The icon has no lettering, so a new name (9A) needs no new
// icon.
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

// The icon's sunrise gradient, a cream bubble (Simple's card color) and a
// soft coral heart.
const COLORS = {
  gradientTop: '#FAD48B',
  gradientBottom: '#F29E7B',
  bubble: '#FFFBF3',
  heart: '#E46F6A',
  shadow: '#B5603F',
};

// A heart whose bounding box is centered on (cx, cy), `w` wide.
function heartPath(cx, cy, w) {
  const s = w / 100;
  const x = (v) => (cx + (v - 50) * s).toFixed(1);
  const y = (v) => (cy + (v - 44) * s).toFixed(1);
  return [
    `M ${x(50)} ${y(88)}`,
    `C ${x(22)} ${y(68)} ${x(0)} ${y(50)} ${x(0)} ${y(28)}`,
    `C ${x(0)} ${y(12)} ${x(12)} ${y(0)} ${x(27)} ${y(0)}`,
    `C ${x(37)} ${y(0)} ${x(45)} ${y(5)} ${x(50)} ${y(14)}`,
    `C ${x(55)} ${y(5)} ${x(63)} ${y(0)} ${x(73)} ${y(0)}`,
    `C ${x(88)} ${y(0)} ${x(100)} ${y(12)} ${x(100)} ${y(28)}`,
    `C ${x(100)} ${y(50)} ${x(78)} ${y(68)} ${x(50)} ${y(88)} Z`,
  ].join(' ');
}

// The mark: a soft speech bubble holding a heart, in a 1024 box around its
// middle, scaled by `k` (1 = the bubble is 560 wide).
function bubbleShapes(k = 1) {
  const c = 512;
  const w = 560 * k;
  const h = 430 * k;
  const left = c - w / 2;
  const top = c - h / 2 - 40 * k;
  const r = 200 * k;
  // The tail, low on the left, curving out like a gentle comma. A round
  // stroke in the same color softens its tip.
  const tail = [
    `M ${left + 125 * k} ${top + h - 60 * k}`,
    `C ${left + 118 * k} ${top + h + 30 * k} ${left + 88 * k} ${top + h + 78 * k} ${left + 52 * k} ${top + h + 100 * k}`,
    `C ${left + 135 * k} ${top + h + 98 * k} ${left + 210 * k} ${top + h + 62 * k} ${left + 255 * k} ${top + h - 10 * k}`,
    'Z',
  ].join(' ');
  return {
    body: `<rect x="${left}" y="${top}" width="${w}" height="${h}" rx="${r}" ry="${r}"/>`,
    tail: `<path d="${tail}" stroke-width="${26 * k}" stroke-linejoin="round"/>`,
    heart: heartPath(c, top + h / 2 + 6 * k, 215 * k),
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
  <g filter="url(#soft)" fill="${COLORS.shadow}" stroke="${COLORS.shadow}" opacity="0.22" transform="translate(0 ${18 * k})">${m.body}${m.tail}</g>
  <g fill="${COLORS.bubble}" stroke="${COLORS.bubble}">${m.body}${m.tail}</g>
  <path d="${m.heart}" fill="${COLORS.heart}"/>`;
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
// a one-color version for themed icons (Android 13+).
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
      `<mask id="cut"><rect width="1024" height="1024" fill="white"/><path d="${m.heart}" fill="black"/></mask>
       <g fill="#FFFFFF" stroke="#FFFFFF" mask="url(#cut)">${m.body}${m.tail}</g>`
    ),
    432
  );
}

// Splash: the mark the other way round (a sunrise bubble with a cream
// heart), so it shows on the cream background set in app.json, the same
// cream the app opens on. One gradient across bubble and tail together.
{
  const m = bubbleShapes(1);
  const shared = `<linearGradient id="bgu" gradientUnits="userSpaceOnUse" x1="330" y1="240" x2="540" y2="820">
    <stop offset="0" stop-color="${COLORS.gradientTop}"/>
    <stop offset="1" stop-color="${COLORS.gradientBottom}"/>
  </linearGradient>`;
  render(
    path.join(ASSETS, 'splash-icon.png'),
    svg(1024, 1024, `<g fill="url(#bgu)" stroke="url(#bgu)">${m.body}${m.tail}</g><path d="${m.heart}" fill="${COLORS.bubble}"/>`, shared),
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
       ${text(66, 32, '#8A8A8A', 'A kind word for you')}
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
// gradient, with a few soft hearts and lights. No words, so it suits every
// language and any name.
{
  const lights = [[140, 110, 7], [230, 380, 5], [860, 90, 6], [930, 300, 8], [780, 420, 5], [330, 60, 4], [700, 60, 4], [90, 300, 5]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6E2" opacity="0.8"/>`)
    .join('');
  const hearts = [[205, 230, 46, -12, 0.55], [835, 190, 58, 10, 0.6], [905, 395, 34, -6, 0.45], [120, 420, 30, 8, 0.4]]
    .map(([x, y, w, turn, o]) => `<path d="${heartPath(x, y, w)}" fill="#FFF3E6" opacity="${o}" transform="rotate(${turn} ${x} ${y})"/>`)
    .join('');
  render(
    path.join(STORE, 'feature-graphic.png'),
    svg(
      1024,
      500,
      `<rect width="1024" height="500" fill="url(#bg)"/>${lights}${hearts}
       <g transform="translate(512 250) scale(0.62) translate(-512 -490)">${mark(1)}</g>`,
      gradient + softShadow
    ),
    1024,
    { opaque: true }
  );
}
