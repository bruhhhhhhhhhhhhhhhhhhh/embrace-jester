import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let createCanvas;
let registerFont;

try {
  ({ createCanvas, registerFont } = await import("canvas"));
} catch {
  throw new Error(
    "[generate_design] Missing optional dependency 'canvas'. Install it locally before running this script."
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../public/designs/paused_my_org_claw.png"
);
const WIDTH = 4500;
const HEIGHT = 5400;
const FONT_FAMILY = "Impact";
const FONT_PATH = path.resolve(__dirname, "../fonts/Impact.ttf");

const TOP_TEXT = {
  text: "I PAUSED MY",
  fill: "#FFFFFF",
  stroke: "#000000",
  y: 1400,
  size: 500,
  strokeWidth: 15,
};

const ORG_TEXT = {
  text: ".ORG",
  fill: "#0000EE",
  stroke: "#000000",
  y: 2200,
  size: 650,
  strokeWidth: 20,
};

const BOTTOM_TEXT = {
  text: "TO BE HERE",
  fill: "#FFFFFF",
  size: 500,
};

function loadFont() {
  if (!fs.existsSync(FONT_PATH)) {
    console.warn(
      `[generate_design] Font not found at ${FONT_PATH}. Using system Impact if available.`
    );
    return;
  }

  try {
    registerFont(FONT_PATH, { family: FONT_FAMILY });
    console.log(`[generate_design] Loaded font from ${FONT_PATH}`);
  } catch (error) {
    console.error("[generate_design] Failed to load font:", error);
  }
}

function drawText(ctx, { text, fill, stroke, x, y, fontSize, strokeWidth }) {
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = fill;
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (stroke) ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

function drawUnderline(ctx, x, y, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 32;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.lineTo(x + width / 2, y);
  ctx.stroke();
}

function drawClawHammer(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#000000";

  const handleHeight = size * 1.1;
  const handleWidthTop = size * 0.12;
  const handleWidthBottom = size * 0.18;
  const handleTopY = 0;
  const handleBottomY = handleHeight;

  ctx.beginPath();
  ctx.moveTo(-handleWidthTop / 2, handleTopY);
  ctx.lineTo(handleWidthTop / 2, handleTopY);
  ctx.lineTo(handleWidthBottom / 2, handleBottomY);
  ctx.lineTo(-handleWidthBottom / 2, handleBottomY);
  ctx.closePath();
  ctx.fill();

  const headHeight = size * 0.25;
  const headWidth = size * 0.42;
  ctx.fillRect(-headWidth / 2, -headHeight, headWidth, headHeight);

  const faceWidth = size * 0.22;
  ctx.fillRect(headWidth / 2, -headHeight * 0.8, faceWidth, headHeight * 0.8);

  ctx.beginPath();
  ctx.moveTo(-headWidth / 2, -headHeight * 0.65);
  ctx.bezierCurveTo(
    -headWidth / 2 - size * 0.18,
    -headHeight * 0.85,
    -headWidth / 2 - size * 0.2,
    -headHeight * 0.25,
    -headWidth / 2,
    -headHeight * 0.1
  );
  ctx.lineTo(-headWidth / 2 + size * 0.07, -headHeight * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function applyGrunge(ctx) {
  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    if (Math.random() < 0.12) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function main() {
  loadFont();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.globalCompositeOperation = "source-over";

  // Layer 1: Top text
  drawText(ctx, {
    text: TOP_TEXT.text,
    fill: TOP_TEXT.fill,
    stroke: TOP_TEXT.stroke,
    x: WIDTH / 2,
    y: TOP_TEXT.y,
    fontSize: TOP_TEXT.size,
    strokeWidth: TOP_TEXT.strokeWidth,
  });

  // Layer 2: Hyperlink row (.ORG + hammer)
  ctx.font = `${ORG_TEXT.size}px ${FONT_FAMILY}`;
  const linkWidth = ctx.measureText(ORG_TEXT.text).width;
  const hammerSize = 600;
  const groupWidth = linkWidth + 40 + hammerSize;
  const groupStartX = WIDTH / 2 - groupWidth / 2;
  const textCenterX = groupStartX + linkWidth / 2;
  const hammerCenterX = groupStartX + linkWidth + 40 + hammerSize / 2;

  drawText(ctx, {
    text: ORG_TEXT.text,
    fill: ORG_TEXT.fill,
    stroke: ORG_TEXT.stroke,
    x: textCenterX,
    y: ORG_TEXT.y,
    fontSize: ORG_TEXT.size,
    strokeWidth: ORG_TEXT.strokeWidth,
  });
  drawUnderline(ctx, textCenterX, 2600, linkWidth, ORG_TEXT.fill);
  drawClawHammer(ctx, hammerCenterX, ORG_TEXT.y - 60, hammerSize);

  // Layer 3: Bottom anchor box + text
  const boxWidth = 3200;
  const boxHeight = 750;
  const boxX = (WIDTH - boxWidth) / 2;
  const boxY = 2600;
  ctx.fillStyle = "#000000";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  drawText(ctx, {
    text: BOTTOM_TEXT.text,
    fill: BOTTOM_TEXT.fill,
    stroke: null,
    x: WIDTH / 2,
    y: boxY + boxHeight / 2,
    fontSize: BOTTOM_TEXT.size,
    strokeWidth: 0,
  });

  // Final polish: Grunge texture
  applyGrunge(ctx);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, canvas.toBuffer("image/png"));
  console.log(`[generate_design] Saved design to ${OUTPUT_PATH}`);
}

main();
