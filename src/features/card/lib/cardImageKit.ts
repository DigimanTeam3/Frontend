// Small canvas helpers shared by the parts of the card share image (renderCardImage, drawSticker).

/** Colours and font of the share image, read from the page so they follow the theme tokens. */
export interface CardImageStyle {
  ink: string
  gate: string
  /** Pink for text and icons on light ground. */
  gateInk: string
  /** Card paper (surface). */
  paper: string
  /** Page background: the margin around the card and the face of the complete badge. */
  page: string
  fontFamily: string
}

/** A CSS box shadow (0 offsetY blur, colour ink at `alpha`), in the units of the drawing. */
export interface SoftShadow {
  offsetY: number
  blur: number
  alpha: number
}

function themeColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value === '' ? fallback : value
}

export function readCardImageStyle(): CardImageStyle {
  const ink = themeColor('--color-ink', 'black')
  return {
    ink,
    // A token that is not in the theme (yet) falls back like its Tailwind class does on screen:
    // the point colour to the text colour, the backgrounds to plain white.
    gate: themeColor('--color-gate', ink),
    gateInk: themeColor('--color-gate-ink', ink),
    paper: themeColor('--color-surface', 'white'),
    page: themeColor('--color-app', 'white'),
    fontFamily: getComputedStyle(document.body).fontFamily || 'sans-serif',
  }
}

export function circlePath(radius: number) {
  const path = new Path2D()
  path.arc(0, 0, radius, 0, Math.PI * 2)
  return path
}

export function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const path = new Path2D()
  path.moveTo(x + radius, y)
  path.arcTo(x + width, y, x + width, y + height, radius)
  path.arcTo(x + width, y + height, x, y + height, radius)
  path.arcTo(x, y + height, x, y, radius)
  path.arcTo(x, y, x + width, y, radius)
  path.closePath()
  return path
}

/** Fills an opaque shape with soft shadows under it. */
export function fillWithShadow(
  context: CanvasRenderingContext2D,
  path: Path2D,
  fill: string,
  shadowColor: string,
  shadows: SoftShadow[],
) {
  // Canvas shadows are measured in canvas pixels whatever the transform is.
  const { a, b } = context.getTransform()
  const pixelsPerUnit = Math.hypot(a, b)
  for (const shadow of shadows) {
    context.save()
    // A shadow is as opaque as its shape, so the shape is painted faint here to get the shadow
    // at its own opacity, and again at full strength below.
    context.globalAlpha = shadow.alpha
    context.shadowColor = shadowColor
    context.shadowOffsetY = shadow.offsetY * pixelsPerUnit
    context.shadowBlur = shadow.blur * pixelsPerUnit
    context.fillStyle = fill
    context.fill(path)
    context.restore()
  }
  context.fillStyle = fill
  context.fill(path)
}
