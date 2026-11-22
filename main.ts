// THE WORLD TODAY — Sunday 22 November 2026
// A one-page newspaper front page summing up the world's news of 22 November 2026.
// Node 22, standard library only. Draws one 1024x1024 PNG to /output/entry.png.
// Hand-rolled vector stroke font (no external assets, no network) + hand-rolled PNG encoder.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [247, 242, 230];
const INK: [number, number, number] = [18, 18, 18];
const RED: [number, number, number] = [140, 26, 26];
const GREY: [number, number, number] = [90, 86, 76];

const img = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  img[i * 3] = PAPER[0];
  img[i * 3 + 1] = PAPER[1];
  img[i * 3 + 2] = PAPER[2];
}

type RGB = [number, number, number];

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  img[o] = c[0];
  img[o + 1] = c[1];
  img[o + 2] = c[2];
}

function dot(x: number, y: number, c: RGB, t: number): void {
  const half = Math.floor(t / 2);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) setPx(x + dx, y + dy, c);
  }
}

// Bresenham line with square pen of size t.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, t: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const n = Math.max(dx, dy, 1);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const y = Math.round(y0 + ((y1 - y0) * i) / n);
    dot(x, y, c, t);
  }
}

function hrule(x: number, y: number, w: number, c: RGB, t: number): void {
  for (let k = 0; k < t; k++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, y + k, c);
  }
}

function vrule(x: number, y: number, h: number, c: RGB, t: number): void {
  for (let k = 0; k < t; k++) {
    for (let yy = y; yy < y + h; yy++) setPx(x + k, yy, c);
  }
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, c);
  }
}

// ---------------------------------------------------------------- font
// Glyphs as polylines on a 6-wide x 8-tall grid (x 0..5, y 0..7).
// NOTE on the '9': top bowl + right stem only, NEVER two loops (a two-loop 9 reads as 8).
type Stroke = [number, number][];
type Glyph = Stroke[];

const GLYPHS: Record<string, Glyph> = {
  A: [[[0, 7], [2, 0], [5, 7]], [[1, 4], [4, 4]]],
  B: [[[0, 0], [0, 7]], [[0, 0], [3, 0], [5, 1], [5, 3], [3, 4], [0, 4]], [[3, 4], [5, 5], [5, 6], [4, 7], [0, 7]]],
  C: [[[5, 1], [4, 0], [1, 0], [0, 1], [0, 6], [1, 7], [4, 7], [5, 6]]],
  D: [[[0, 0], [0, 7], [3, 7], [5, 5], [5, 2], [3, 0], [0, 0]]],
  E: [[[5, 0], [0, 0], [0, 7], [5, 7]], [[0, 3], [4, 3]]],
  F: [[[0, 0], [0, 7]], [[0, 0], [5, 0]], [[0, 3], [4, 3]]],
  G: [[[5, 1], [4, 0], [1, 0], [0, 1], [0, 6], [1, 7], [4, 7], [5, 6], [5, 4], [3, 4]]],
  H: [[[0, 0], [0, 7]], [[5, 0], [5, 7]], [[0, 3], [5, 3]]],
  I: [[[1, 0], [4, 0]], [[2, 0], [2, 7]], [[1, 7], [4, 7]]],
  J: [[[2, 0], [5, 0]], [[4, 0], [4, 6], [3, 7], [1, 7], [0, 6]]],
  K: [[[0, 0], [0, 7]], [[4, 0], [0, 4], [5, 7]]],
  L: [[[0, 0], [0, 7], [5, 7]]],
  M: [[[0, 7], [0, 0], [2, 4], [5, 0], [5, 7]]],
  N: [[[0, 7], [0, 0], [5, 7], [5, 0]]],
  O: [[[1, 0], [4, 0], [5, 1], [5, 6], [4, 7], [1, 7], [0, 6], [0, 1], [1, 0]]],
  P: [[[0, 7], [0, 0], [4, 0], [5, 1], [5, 3], [4, 4], [0, 4]]],
  Q: [[[1, 0], [4, 0], [5, 1], [5, 6], [4, 7], [1, 7], [0, 6], [0, 1], [1, 0]], [[3, 5], [5, 7]]],
  R: [[[0, 7], [0, 0], [4, 0], [5, 1], [5, 3], [4, 4], [0, 4]], [[3, 4], [5, 7]]],
  S: [[[5, 1], [4, 0], [1, 0], [0, 1], [0, 3], [1, 4], [4, 4], [5, 5], [5, 6], [4, 7], [1, 7], [0, 6]]],
  T: [[[0, 0], [5, 0]], [[2, 0], [2, 7]]],
  U: [[[0, 0], [0, 6], [1, 7], [4, 7], [5, 6], [5, 0]]],
  V: [[[0, 0], [2, 7], [5, 0]]],
  W: [[[0, 0], [1, 7], [2, 3], [3, 7], [5, 0]]],
  X: [[[0, 0], [5, 7]], [[5, 0], [0, 7]]],
  Y: [[[0, 0], [2, 3], [5, 0]], [[2, 3], [2, 7]]],
  Z: [[[0, 0], [5, 0], [0, 7], [5, 7]]],
  '0': [[[1, 0], [4, 0], [5, 1], [5, 6], [4, 7], [1, 7], [0, 6], [0, 1], [1, 0]]],
  '1': [[[2, 1], [3, 0], [3, 7]], [[1, 7], [5, 7]]],
  '2': [[[0, 1], [1, 0], [4, 0], [5, 1], [5, 3], [0, 7], [5, 7]]],
  '3': [[[0, 1], [1, 0], [4, 0], [5, 1], [5, 3], [4, 4]], [[4, 4], [5, 5], [5, 6], [4, 7], [1, 7], [0, 6]]],
  '4': [[[4, 0], [0, 4], [5, 4]], [[4, 0], [4, 7]]],
  '5': [[[5, 0], [0, 0], [0, 3], [4, 3], [5, 4], [5, 6], [4, 7], [1, 7], [0, 6]]],
  '6': [[[4, 0], [3, 0], [1, 1], [0, 3], [0, 6], [1, 7], [4, 7], [5, 6], [5, 4], [4, 3], [1, 3]]],
  '7': [[[0, 0], [5, 0], [2, 7]]],
  '8': [[[1, 1], [4, 1], [5, 2], [5, 3], [4, 4], [1, 4], [0, 3], [0, 2], [1, 1]], [[1, 4], [4, 4], [5, 5], [5, 6], [4, 7], [1, 7], [0, 6], [0, 5], [1, 4]]],
  '9': [[[1, 0], [4, 0], [5, 1], [5, 3], [4, 4], [1, 4], [0, 3], [0, 2], [1, 0]], [[5, 1], [5, 7]]],
  '.': [[[2, 6], [2, 7]]],
  ',': [[[2, 5], [2, 6], [1, 7]]],
  ':': [[[2, 2]], [[2, 5]]],
  ';': [[[2, 2]], [[2, 5], [2, 6], [1, 7]]],
  "'": [[[2, 0], [2, 2]]],
  '’': [[[2, 0], [2, 2]]],
  '‘': [[[2, 0], [2, 2]]],
  '"': [[[1, 0], [1, 2]], [[3, 0], [3, 2]]],
  '!': [[[2, 0], [2, 5]], [[2, 6], [2, 7]]],
  '?': [[[1, 1], [2, 0], [4, 0], [5, 1], [5, 3], [3, 4]], [[3, 6], [3, 7]]],
  '-': [[[0, 4], [5, 4]]],
  '—': [[[0, 4], [5, 4]]],
  '(': [[[4, 0], [2, 1], [2, 6], [4, 7]]],
  ')': [[[1, 0], [3, 1], [3, 6], [1, 7]]],
  '/': [[[5, 0], [0, 7]]],
  '%': [[[0, 0], [5, 7]], [[0, 1], [1, 0], [2, 1], [1, 2], [0, 1]], [[3, 6], [4, 5], [5, 6], [4, 7], [3, 6]]],
  '+': [[[0, 3], [5, 3]], [[2, 0], [2, 7]]],
  '=': [[[0, 2], [5, 2]], [[0, 5], [5, 5]]],
  '•': [[[2, 3]]],
};

const ADV = 7; // advance per character, in glyph units

function thickness(s: number): number {
  if (s >= 7) return 3;
  if (s >= 3) return 2;
  return 1;
}

function drawGlyph(ch: string, x: number, y: number, s: number, c: RGB): void {
  const g = GLYPHS[ch];
  if (!g) return;
  const t = thickness(s);
  for (const stroke of g) {
    for (let i = 0; i + 1 < stroke.length; i++) {
      const [ax, ay] = stroke[i];
      const [bx, by] = stroke[i + 1];
      line(x + ax * s, y + ay * s, x + bx * s, y + by * s, c, t);
    }
    if (stroke.length === 1) {
      const [ax, ay] = stroke[0];
      dot(x + ax * s, y + ay * s, c, t);
    }
  }
}

function textWidth(text: string, s: number): number {
  return text.length * ADV * s;
}

function drawText(x: number, y: number, text: string, s: number, c: RGB, align: 'l' | 'c' | 'r' = 'l'): void {
  const up = text.toUpperCase();
  let start = x;
  if (align === 'c') start = x - Math.floor(textWidth(up, s) / 2);
  if (align === 'r') start = x - textWidth(up, s);
  for (let i = 0; i < up.length; i++) {
    const ch = up[i];
    if (ch === ' ') continue;
    drawGlyph(ch, start + i * ADV * s, y, s, c);
  }
}

// Greedy word wrap; returns lines that fit maxW pixels at scale s.
function wrap(text: string, maxW: number, s: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur === '' ? w : cur + ' ' + w;
    if (textWidth(trial, s) <= maxW) {
      cur = trial;
    } else {
      if (cur !== '') lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- PNG encoder
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter none
    img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- layout
const MX = 28; // left/right margin
const CW = W - MX * 2; // 968 content width

// Outer double border
hrule(8, 8, W - 16, INK, 3);
hrule(8, H - 11, W - 16, INK, 3);
vrule(8, 8, H - 16, INK, 3);
vrule(W - 11, 8, H - 16, INK, 3);
hrule(14, 14, W - 28, INK, 1);
hrule(14, H - 15, W - 28, INK, 1);
vrule(14, 14, H - 28, INK, 1);
vrule(W - 15, 14, H - 28, INK, 1);

// Masthead
drawText(W / 2, 30, 'THE WORLD TODAY', 7, INK, 'c');
hrule(MX, 100, CW, INK, 2);

// Date bar
drawText(MX, 112, 'VOL. 1 — NO. 22', 1, GREY, 'l');
drawText(W / 2, 108, 'SUNDAY 22 NOVEMBER 2026', 3, INK, 'c');
drawText(W - MX, 112, 'SUNDAY EDITION', 1, GREY, 'r');
hrule(MX, 140, CW, INK, 3);

// ---- Top story: COP31 Antalya
drawText(MX, 154, 'CLIMATE SUMMIT — ANTALYA, TURKEY', 2, RED, 'l');
drawText(MX, 178, 'COP31 TALKS INTO A SECOND', 3, INK, 'l');
drawText(MX, 206, 'DAY OF OVERTIME OVER FOSSIL FUELS', 3, INK, 'l');
const topBody = wrap(
  'Negotiators in Antalya push into a second day of overtime, deadlocked over fossil fuels. ' +
    'An EU official says it is "a good deal or no deal". The summit president says a final ' +
    'agreement is close. King Charles thanks President Erdogan for hosting.',
  CW,
  1,
);
topBody.forEach((ln, i) => drawText(MX, 240 + i * 11, ln, 1, INK, 'l'));
hrule(MX, 288, CW, INK, 2);

// ---- Eight panels: two columns x four rows
interface Panel {
  kicker: string;
  headline: string;
  body: string;
}
const panels: Panel[] = [
  {
    kicker: 'UKRAINE — KRYVYI RIH',
    headline: "MISSILE KILLS TWO IN ZELENSKY'S HOMETOWN",
    body: 'A seven-year-old child and a paramedic are among the dead. Homes burn in Kyiv\'s Podilskyi district.',
  },
  {
    kicker: 'GULF OF FINLAND',
    headline: 'UKRAINE DRONE SETS RUSSIAN-LINKED SHIP ABLAZE',
    body: 'The cargo vessel drifts into Finnish waters after the strike.',
  },
  {
    kicker: 'POLAND',
    headline: 'AIRSPACE VIOLATED AS OBJECTS CROSS BORDER',
    body: 'Three objects, probably two missiles and a drone. NATO chief Rutte: the alliance will defend every inch of Polish territory.',
  },
  {
    kicker: 'THE GULF',
    headline: 'IRAN HITS BAHRAIN AS REGIONAL TENSIONS RISE',
    body: 'An industrial facility is struck and air defences intercept attacks. The Saudi-led coalition shoots down Houthi missiles aimed at Riyadh. Two tankers are attacked near Oman.',
  },
  {
    kicker: 'MEXICO — SINALOA',
    headline: "CARTEL BOSS 'EL CHAPO ISIDRO' CAPTURED",
    body: 'Fausto Isidro Meza Flores is seized in Sinaloa. Eleven people are killed in the violence that follows.',
  },
  {
    kicker: 'HONG KONG',
    headline: '856 CANDIDATES COMPETE FOR 723 SEATS',
    body: 'Turnout reaches 89.81 percent by 1 pm in Election Committee subsector polls. The 1,500-member committee picks the chief executive in March 2027.',
  },
  {
    kicker: 'MARKETS',
    headline: 'US STOCKS FALL INTO CORRECTION IN AI SELL-OFF',
    body: 'Shares slide as the artificial-intelligence rally unwinds.',
  },
  {
    kicker: 'TRADE',
    headline: 'EU AND INDONESIA SIGN TRADE DEAL',
    body: 'The agreement ends ten years of talks between Brussels and Jakarta.',
  },
];

const PANEL_W = 472;
const PANEL_X = [MX, MX + PANEL_W + 24];
const PANEL_Y0 = 302;
const ROW_H = 102;

panels.forEach((p, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const x = PANEL_X[col];
  const y = PANEL_Y0 + row * ROW_H;
  drawText(x, y, p.kicker, 1, RED, 'l');
  const hl = wrap(p.headline, PANEL_W, 2);
  hl.slice(0, 2).forEach((ln, i) => drawText(x, y + 12 + i * 19, ln, 2, INK, 'l'));
  const bd = wrap(p.body, PANEL_W, 1);
  bd.slice(0, 3).forEach((ln, i) => drawText(x, y + 12 + hl.slice(0, 2).length * 19 + 2 + i * 11, ln, 1, INK, 'l'));
  if (row < 3) hrule(x, y + ROW_H - 12, PANEL_W, GREY, 1);
});
vrule(MX + PANEL_W + 11, PANEL_Y0 + 2, ROW_H * 4 - 14, GREY, 1);
hrule(MX, PANEL_Y0 + ROW_H * 4 - 2, CW, INK, 2);

// ---- Quote box
const QY = 722;
fillRect(MX, QY, 6, 52, RED);
drawText(MX + 18, QY + 2, '"A GOOD DEAL OR NO DEAL"', 2, INK, 'l');
drawText(MX + 18, QY + 26, '— AN EU OFFICIAL AT COP31 IN ANTALYA', 1, GREY, 'l');
drawText(MX + 18, QY + 40, 'KING CHARLES THANKS PRESIDENT ERDOGAN FOR HOSTING THE SUMMIT', 1, GREY, 'l');
hrule(MX, QY + 58, CW, INK, 2);

// ---- In brief: two columns of one-line briefs
drawText(MX, 792, 'IN BRIEF', 2, INK, 'l');
hrule(MX, 814, CW, INK, 1);

const briefs: string[] = [
  "UN TALKS AGREE TO REGULATE 'KILLER ROBOTS' BY 2028",
  'RUSSIA OPPOSES THE KILLER-ROBOT PACT',
  'FIRE AT BASRA POWER STATION KILLS 4, INJURES 35',
  'INDONESIA CANDY FACTORY FIRE KILLS 3, 36 MISSING',
  'FBI CRIMINAL DATABASE HACKED, CNN REPORTS',
  "WHALE GENOME CAPTURED FROM A WHALE'S BREATH",
  'DENMARK SAYS IT FOILED A RUSSIAN PLOT TO KILL A RAPPER',
  'UK TO BUILD LONG-RANGE DRONES FOR UKRAINE',
  'ZELENSKY: NATO MEMBERSHIP IS THE STRONGEST GUARANTEE',
  "TRUMP CALLS PUTIN HIS FRIEND; ZELENSKY CALLS HIM 'KILLER'",
  'SAUDI ARABIA INTERCEPTS THREE HOUTHI MISSILES',
  'UNIFIL: SOUTHERN LEBANON STILL BEARS THE IMPACT OF WAR',
  'EU BUDGET CHAIR PROPOSES CUTS AND A DIGITAL TAX',
  'CARGO SHIP DRIFTS INTO FINNISH WATERS AFTER FIRE',
  'UKRAINE: MOSCOW HAS LOST OVER 1.6 MILLION TROOPS',
  'AFRICAN GROUP DISAPPOINTED BY COP31 OUTCOME',
  'MOSCOW: A YEAR TO CLEAR THE FALLEN CRIMEAN BRIDGE',
  'COP31 PRESIDENT: FINAL AGREEMENT IS CLOSE',
  'INDIA BEATS SOUTH KOREA 2-1 IN HOCKEY',
  'HONG KONG TURNOUT 89.81% BY 1 PM',
  'EU-INDONESIA DEAL ENDS TEN YEARS OF TALKS',
  'MEXICO: 11 KILLED AFTER CARTEL BOSS CAPTURE',
  'POLAND: THREE OBJECTS CROSS THE BORDER',
  'NATO: WE WILL DEFEND EVERY INCH OF POLAND',
  'IRAN STRIKES INDUSTRIAL FACILITY IN BAHRAIN',
  'TWO TANKERS ATTACKED NEAR OMAN',
  'US STOCKS SLIDE AS AI RALLY UNWINDS',
  'INDIA AND JAPAN EXPAND DEFENCE PARTNERSHIP',
  'ETHIOPIA: NEARLY 700,000 DISPLACED BY FIGHTING',
  'AUSTRALIA CRITICISES US REPORT ON AUKUS SUBMARINES',
  'CYCLONE XAVIER WEAKENS NORTH OF SAMOA',
  'INDIA PASSES ONE CRORE HPV VACCINE DOSES',
  '9 OF ONE FAMILY KILLED IN RAJASTHAN ROAD CRASH',
];

const BRIEF_Y0 = 826;
const BRIEF_LEAD = 10;
briefs.forEach((b, i) => {
  const col = i < 17 ? 0 : 1;
  const row = col === 0 ? i : i - 17;
  drawText(PANEL_X[col], BRIEF_Y0 + row * BRIEF_LEAD, '• ' + b, 1, INK, 'l');
});

// Footer
drawText(W / 2, 998, 'THE WORLD TODAY — 43 STORIES FROM 9 REGIONS — SUNDAY 22 NOVEMBER 2026', 1, GREY, 'c');

// ---------------------------------------------------------------- write out
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
