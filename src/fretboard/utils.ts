import { paramCase } from 'change-case';
import { Selection, BaseType, touches } from 'd3-selection';
import { Position, Options } from './Fretboard';

export function getStringThickness({
  stringWidth,
  stringIndex
}: {
  stringWidth: number | [number];
  stringIndex: number;
}): number {
  if (typeof stringWidth === 'number') {
    return stringWidth;
  }
  return stringWidth[stringIndex] || 1;
}

export function generateStrings({
  stringCount,
  stringWidth,
  height
}: {
  stringCount: number;
  stringWidth: number | [number];
  height: number;
}): number[] {
  const strings = [];
  let currentStringWidth = 0;

  for (let i = 0; i < stringCount; i++) {
    currentStringWidth = getStringThickness({ stringWidth, stringIndex: i });
    let y = (height / (stringCount - 1)) * i;
    if (i === 0) {
      y += currentStringWidth / 2;
    }
    if (i === stringCount - 1) {
      y -= currentStringWidth / 2;
    }
    strings.push(y);
  }
  return strings;
}

export function generateFrets({
  scaleFrets,
  fretCount
}: {
  scaleFrets: boolean;
  fretCount: number;
}): number[] {
  const fretRatio = Math.pow(2, 1 / 12);
  const frets = [0];

  for (let i = 1; i <= fretCount; i++) {
    let x = (100 / fretCount) * i;
    if (scaleFrets) {
      x = 100 - 100 / Math.pow(fretRatio, i);
    }
    frets.push(x);
  }
  return frets.map(x => x / frets[frets.length - 1] * 100);
}

const accidentalMap: { symbol: string; replacement: string }[] = [{
  symbol: '##',
  replacement: 'double-sharp'
}, {
  symbol: 'bb',
  replacement: 'double-flat'
}, {
  symbol: '#',
  replacement: 'sharp'
}, {
  symbol: 'b',
  replacement: 'flat'
}];

function valueRenderer(key: string, value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return !value ? 'false' : null;
  }
  if (key === 'note') {
    for (let i = 0; i < accidentalMap.length; i++) {
      const { symbol, replacement } = accidentalMap[i];
      if (`${value}`.endsWith(symbol)) {
        return `${`${value}`[0]}-${replacement}`;
      }
    }
    return `${value}`;
  }
  return `${value}`;
}

function classRenderer(prefix: string, key: string, value: string | number | boolean): string {
  return [
    'dot',
    prefix,
    paramCase(key),
    valueRenderer(key, value),
  ].filter(x => !!x).join('-');
}

export function dotClasses(dot: Position, prefix = ''): string {
  return [
    prefix ? `dot-${prefix}` : null,
    `dot-id-s${dot.string}:f${dot.fret}`,
    ...Object.entries(dot)
      .map(([key, value]: [string, string | Array<string>]) => {
        let valArray: string[];
        if (!(value instanceof Array)) {
          valArray = [value];
        } else {
          valArray = value;
        }
        return valArray.map(value => classRenderer(prefix, key, value)).join(' ');
      })
  ].filter(x => !!x).join(' ');
}

export function getDimensions({
  topPadding,
  bottomPadding,
  leftPadding,
  rightPadding,
  width,
  height,
  showFretNumbers,
  fretNumbersHeight
}: {
  topPadding: number;
  bottomPadding: number;
  leftPadding: number;
  rightPadding: number;
  width: number;
  height: number;
  showFretNumbers: boolean;
  fretNumbersHeight: number;
}): {
  totalWidth: number;
  totalHeight: number;
} {
  const totalWidth = width + leftPadding + rightPadding;
  let totalHeight = height + topPadding + bottomPadding;

  if (showFretNumbers) {
    totalHeight += fretNumbersHeight;
  }
  return { totalWidth, totalHeight };
}

type GetPositionParams = {
  event: MouseEvent | TouchEvent ;
  stringsGroup: Selection<BaseType, unknown, HTMLElement, unknown>;
  nutWidth: number;
  strings: number[];
  frets: number[];
  dots: Position[];
}

export const getPositionFromMouseCoords = ({
  event,
  stringsGroup,
  nutWidth,
  strings,
  frets,
  dots
}: GetPositionParams): Position | undefined => {

  // Determine the event type at runtime and extract coordinates
  let clientX: number ;
  let clientY: number ;

  if ( event instanceof TouchEvent)
  {
    if ( event.touches.length > 0 )
    {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }
    else
    {
      // This is a realistic case for the touch end event
      return undefined ;
    }
  }
  else if ( event instanceof MouseEvent )
  {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  else
  {
    return undefined ;
  }

  const bounds = (stringsGroup.node() as HTMLElement).getBoundingClientRect();
  const x = clientX - bounds.left;
  const y = clientY - bounds.top;

  // Get the separation of the strings
  const stringDistance = bounds.height / (strings.length - 1) ;

  // Divide Y by the separation and round to the nearest integer.
  const foundString = Math.round ( y / stringDistance ) ;

  // Check for invalid string numbers after rounding
  if ( foundString < 0 )
    return undefined ;
  else if ( foundString >= strings.length )
    return undefined ;

  let foundFret = -1;
  const percentX = (Math.max(0, x) / bounds.width) * 100;

  for (let i = 0; i < frets.length; i++) {
    if (percentX < frets[i]) {
      foundFret = i;
      break;
    }
    foundFret = i;
  }

  if (x < nutWidth) {
    foundFret = 0;
  }

  const foundDot = dots.find(({ fret, string }) => fret === foundFret && string === foundString + 1);
  return foundDot || {
    string: foundString + 1,
    fret: foundFret
  }
}

export function createHoverDiv(): HTMLDivElement {
  const hoverDiv = document.createElement('div');
  hoverDiv.className = 'hoverDiv';
  hoverDiv.style.position = 'absolute';
  hoverDiv.style.top = '0';
  hoverDiv.style.bottom = '0';
  hoverDiv.style.left = '0';
  hoverDiv.style.right = '0';
  return hoverDiv;
}
