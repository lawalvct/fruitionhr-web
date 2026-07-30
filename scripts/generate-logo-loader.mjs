import { writeFileSync } from "node:fs";

const width = 96;
const height = 96;
const frames = 9;
const palette = [
  [0, 0, 0], [236, 253, 245], [240, 253, 244], [220, 252, 231],
  [134, 239, 172], [34, 197, 94], [4, 120, 87], [22, 163, 74],
  [187, 247, 208], [209, 250, 224], [104, 224, 148], [62, 207, 112],
  [15, 145, 81], [225, 252, 235], [74, 222, 128], [3, 105, 75],
];

const bytes = [];
const push = (...values) => bytes.push(...values);
const word = (value) => push(value & 255, value >> 8);

function roundedRect(x, y, cx, cy, size, radius, rotation) {
  const angle = rotation * Math.PI / 180;
  const dx = x - cx, dy = y - cy;
  const localX = Math.abs(dx * Math.cos(angle) + dy * Math.sin(angle));
  const localY = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
  const half = size / 2;
  const cornerX = Math.max(localX - (half - radius), 0);
  const cornerY = Math.max(localY - (half - radius), 0);
  return Math.hypot(cornerX, cornerY) <= radius && localX <= half && localY <= half;
}

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const length = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / length));
  return Math.hypot(x - (x1 + t * (x2 - x1)), y - (y1 + t * (y2 - y1)));
}

function image(frame) {
  const pixels = new Uint8Array(width * height);
  const pulse = (phase) => Math.max(0, Math.sin((frame / frames) * Math.PI * 2 - phase));
  const specs = [
    [22.5, 22.5, 18, 4, 2, -6, 0],
    [40.5, 40.5, 28, 5, 3, -3, 2.1],
    [63.5, 63.5, 36, 6, 2, 2, 4.2],
  ];

  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const samples = new Map();
    for (const offsetY of [0.25, 0.75]) for (const offsetX of [0.25, 0.75]) {
      const sx = x + offsetX, sy = y + offsetY;
      let color = roundedRect(sx, sy, 48, 48, 94, 17, 0) ? 1 : 0;
      if (color && distanceToSegment(sx, sy, 27, 27, 66, 66) <= 1.1) color = 7;
      for (const [cx, cy, baseSize, strokeColor, fillColor, rotation, phase] of specs) {
        const scale = 1 + pulse(phase) * 0.07;
        const size = baseSize * scale;
        const stroke = baseSize * 0.19;
        if (roundedRect(sx, sy, cx, cy, size, size * 0.09, rotation)) {
          color = roundedRect(sx, sy, cx, cy, size - stroke * 2, Math.max(1, size * 0.05), rotation)
            ? fillColor
            : strokeColor;
        }
      }
      samples.set(color, (samples.get(color) ?? 0) + 1);
    }
    pixels[y * width + x] = [...samples].sort((a, b) => b[1] - a[1])[0][0];
  }
  return pixels;
}

function lzw(data, minSize = 4) {
  const clear = 1 << minSize;
  const end = clear + 1;
  const output = [];
  let buffer = 0, bits = 0;
  const code = (value) => {
    buffer |= value << bits; bits += minSize + 1;
    while (bits >= 8) { output.push(buffer & 255); buffer >>= 8; bits -= 8; }
  };
  for (let i = 0; i < data.length; i += 2) {
    code(clear);
    code(data[i]);
    if (i + 1 < data.length) code(data[i + 1]);
  }
  code(end);
  if (bits) output.push(buffer & 255);
  return output;
}

push(...Buffer.from("GIF89a")); word(width); word(height); push(0xF3, 0, 0);
palette.forEach((rgb) => push(...rgb));
push(0x21, 0xFF, 0x0B, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0);
for (let frame = 0; frame < frames; frame++) {
  push(0x21, 0xF9, 4, 0x05, 10, 0, 0, 0);
  push(0x2C); word(0); word(0); word(width); word(height); push(0);
  push(4);
  const encoded = lzw(image(frame));
  for (let offset = 0; offset < encoded.length; offset += 255) {
    const block = encoded.slice(offset, offset + 255); push(block.length, ...block);
  }
  push(0);
}
push(0x3B);
writeFileSync(new URL("../public/fruitionhr-logo-loader.gif", import.meta.url), Buffer.from(bytes));
