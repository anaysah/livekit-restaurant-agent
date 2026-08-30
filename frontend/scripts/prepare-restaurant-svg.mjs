import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const inputSvgPath = path.join(rootDir, 'assets', 'restaurant-layout.svg');
const outputPreparedSvgPath = path.join(rootDir, 'assets', 'restaurant-layout.prepared.svg');
const outputTsxPath = path.join(rootDir, 'components', 'website', 'booking', 'RestaurantLayoutSvg.tsx');
const outputPositionsJsonPath = path.join(rootDir, 'components', 'website', 'booking', 'table-positions.generated.ts');

if (!fs.existsSync(inputSvgPath)) {
  const fallbackSrc = path.join(rootDir, 'public', 'layout_v0.2.svg');
  if (fs.existsSync(fallbackSrc)) {
    fs.mkdirSync(path.dirname(inputSvgPath), { recursive: true });
    fs.copyFileSync(fallbackSrc, inputSvgPath);
    console.log(`Copied source SVG from ${fallbackSrc} to ${inputSvgPath}`);
  } else {
    console.error(`Error: Source SVG not found at ${inputSvgPath}`);
    process.exit(1);
  }
}

const svgContent = fs.readFileSync(inputSvgPath, 'utf8');

// ─── 1. Category Base Color Standards ──────────────────────────────────────────
// Ensures all tables (including T2, T8, T17) have consistent base styling

const CATEGORY_COLORS = {
  2: { chairFill: '#FAEAE2', stroke: '#C4613A', tableFill: 'white' },
  4: { chairFill: '#EDF0E1', stroke: '#6B7C45', tableFill: 'white' },
  6: { chairFill: '#F5EDD8', stroke: '#9B7A3A', tableFill: 'white' },
  8: { chairFill: '#EEE4DC', stroke: '#7A5C4A', tableFill: 'white' },
};

// ─── 2. Robust SVG XML Tree Parser & Serializer ────────────────────────────────

function parseXml(xmlStr) {
  const tagRegex = /<(\/)?([a-zA-Z0-9_:-]+)([^>]*?)(\/)?>|([^<]+)/g;
  let match;
  const root = { type: 'root', children: [] };
  const stack = [root];

  while ((match = tagRegex.exec(xmlStr)) !== null) {
    const [raw, isClose, tagName, attrStr, isSelfClosing, textContent] = match;
    if (textContent) {
      if (textContent.trim()) {
        stack[stack.length - 1].children.push({ type: 'text', value: textContent });
      }
      continue;
    }

    if (isClose) {
      if (stack.length > 1 && stack[stack.length - 1].name === tagName) {
        stack.pop();
      }
    } else {
      const attrs = {};
      const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(attrStr || '')) !== null) {
        const key = aMatch[1];
        const val = aMatch[2] !== undefined ? aMatch[2] : aMatch[3] !== undefined ? aMatch[3] : aMatch[4] !== undefined ? aMatch[4] : true;
        attrs[key] = val;
      }

      const node = {
        type: 'element',
        name: tagName,
        attrs,
        children: [],
      };

      stack[stack.length - 1].children.push(node);

      const isVoid = isSelfClosing || ['path', 'rect', 'circle', 'line', 'use', 'stop'].includes(tagName);
      if (!isVoid) {
        stack.push(node);
      }
    }
  }
  return root;
}

function serializeNodeToSvg(node, indent = 0) {
  if (node.type === 'root') {
    return node.children.map(c => serializeNodeToSvg(c, indent)).join('\n');
  }
  if (node.type === 'text') {
    return node.value;
  }
  if (node.type === 'element') {
    const pad = '  '.repeat(indent);
    const attrEntries = Object.entries(node.attrs)
      .map(([k, v]) => (v === true ? k : `${k}="${String(v)}"`))
      .join(' ');
    const attrStr = attrEntries.length > 0 ? ' ' + attrEntries : '';

    if (node.children.length === 0) {
      return `${pad}<${node.name}${attrStr}/>`;
    }

    const childrenStr = node.children.map(c => serializeNodeToSvg(c, indent + 1)).join('\n');
    return `${pad}<${node.name}${attrStr}>\n${childrenStr}\n${pad}</${node.name}>`;
  }
  return '';
}

function serializeNodeToJsx(node, indent = 0) {
  if (node.type === 'root') {
    return node.children.map(c => serializeNodeToJsx(c, indent)).join('\n');
  }
  if (node.type === 'text') {
    return node.value;
  }
  if (node.type === 'element') {
    const pad = '  '.repeat(indent);

    const attrMap = {
      'class': 'className',
      'stroke-width': 'strokeWidth',
      'stroke-dasharray': 'strokeDasharray',
      'stroke-linecap': 'strokeLinecap',
      'stroke-linejoin': 'strokeLinejoin',
      'fill-rule': 'fillRule',
      'clip-rule': 'clipRule',
      'stroke-miterlimit': 'strokeMiterlimit',
      'stop-color': 'stopColor',
      'stop-opacity': 'stopOpacity',
    };

    const attrEntries = Object.entries(node.attrs)
      .map(([k, v]) => {
        const jsxKey = attrMap[k] || k;
        if (v === true) return jsxKey;
        return `${jsxKey}="${String(v)}"`;
      });

    if (node.name === 'svg') {
      attrEntries.push('{...props}');
    }

    const attrStr = attrEntries.length > 0 ? ' ' + attrEntries.join(' ') : '';

    if (node.children.length === 0) {
      return `${pad}<${node.name}${attrStr} />`;
    }

    const childrenStr = node.children.map(c => serializeNodeToJsx(c, indent + 1)).join('\n');
    return `${pad}<${node.name}${attrStr}>\n${childrenStr}\n${pad}</${node.name}>`;
  }
  return '';
}

// ─── 3. Geometry & Bounding Box Calculation ───────────────────────────────────

function getPathBBox(d) {
  if (!d) return null;
  const commands = d.match(/([a-df-z])([^a-df-z]*)/gi);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let currX = 0, currY = 0;

  if (commands) {
    for (const cmd of commands) {
      const type = cmd[0];
      const args = (cmd.slice(1).trim().match(/-?[\d.]+(?:e-?\d+)?/gi) || []).map(Number);
      if (type === 'M' || type === 'L') {
        for (let i = 0; i < args.length; i += 2) {
          currX = args[i]; currY = args[i + 1];
          minX = Math.min(minX, currX); maxX = Math.max(maxX, currX);
          minY = Math.min(minY, currY); maxY = Math.max(maxY, currY);
        }
      } else if (type === 'H') {
        for (const x of args) {
          currX = x;
          minX = Math.min(minX, currX); maxX = Math.max(maxX, currX);
        }
      } else if (type === 'V') {
        for (const y of args) {
          currY = y;
          minY = Math.min(minY, currY); maxY = Math.max(maxY, currY);
        }
      } else if (type === 'C') {
        for (let i = 0; i < args.length; i += 6) {
          for (let j = 0; j < 6; j += 2) {
            const x = args[i + j], y = args[i + j + 1];
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }
          currX = args[i + 4]; currY = args[i + 5];
        }
      }
    }
  }

  if (!isFinite(minX)) return null;
  return {
    minX,
    maxX,
    minY,
    maxY,
    cx: Number(((minX + maxX) / 2).toFixed(2)),
    cy: Number(((minY + maxY) / 2).toFixed(2)),
  };
}

// ─── 4. Transform AST & Normalize Table Groups ─────────────────────────────────

console.log('--- Preparing Restaurant Layout SVG ---');

const tree = parseXml(svgContent);

function findTables(node, directParent) {
  if (node.type === 'element' && node.name === 'path' && /^T\d+$/.test(node.attrs.id)) {
    return [{ tableNode: node, groupNode: directParent }];
  }
  let results = [];
  if (node.children) {
    for (const child of node.children) {
      results = results.concat(
        findTables(child, node.type === 'element' && node.name === 'g' ? node : directParent)
      );
    }
  }
  return results;
}

const discoveredTables = findTables(tree, null);
console.log(`Discovered ${discoveredTables.length} tables dynamically: ${discoveredTables.map(t => t.tableNode.attrs.id).join(', ')}`);

const tablePositions = {};
const tableMetadataList = [];

for (const { tableNode, groupNode } of discoveredTables) {
  const tableId = tableNode.attrs.id;
  if (!groupNode) continue;

  const children = groupNode.children;
  const tIndex = children.findIndex(c => c.type === 'element' && c.attrs?.id === tableId);
  if (tIndex === -1) continue;

  // The surface path is the vector element right before the table label path
  const surfaceNode = children[tIndex - 1];
  let surfaceBBox = surfaceNode?.attrs?.d ? getPathBBox(surfaceNode.attrs.d) : null;
  if (!surfaceBBox && tableNode.attrs.d) {
    const tBBox = getPathBBox(tableNode.attrs.d);
    surfaceBBox = tBBox ? { cx: tBBox.cx, cy: tBBox.cy + 9 } : { cx: 0, cy: 0 };
  }

  const cx = surfaceBBox ? surfaceBBox.cx : 0;
  const cy = surfaceBBox ? surfaceBBox.cy : 0;
  const labelY = Number((cy - 7).toFixed(1));
  const statusY = Number((cy + 9).toFixed(1));

  // Determine capacity dynamically
  let capacity = 2;
  const groupStr = JSON.stringify(groupNode);
  const capMatch = groupStr.match(/(\d+)\s*seats/i);
  if (capMatch) {
    capacity = parseInt(capMatch[1], 10);
  } else {
    const tNum = parseInt(tableId.replace(/\D/g, ''), 10);
    if (tNum >= 20) capacity = 8;
    else if (tNum >= 17) capacity = 6;
    else if (tNum >= 7) capacity = 4;
    else capacity = 2;
  }

  tablePositions[tableId] = { x: cx, labelY, statusY, capacity };
  tableMetadataList.push({ id: tableId, capacity, x: cx, labelY, statusY });

  // Update group attributes
  groupNode.attrs['data-table-id'] = tableId;
  groupNode.attrs['data-table-group'] = 'true';
  groupNode.attrs['data-capacity'] = capacity;
  groupNode.attrs['data-label-x'] = cx;
  groupNode.attrs['data-label-y'] = labelY;
  groupNode.attrs['data-status-x'] = cx;
  groupNode.attrs['data-status-y'] = statusY;
  groupNode.attrs['class'] = 'restaurant-table';

  // Normalize colors based on capacity so demo taken tables (T2, T8, T17) get pristine category colors
  const catColors = CATEGORY_COLORS[capacity] || CATEGORY_COLORS[2];

  for (let i = 0; i < tIndex; i++) {
    const child = children[i];
    if (child.type !== 'element') continue;

    if (i === tIndex - 1) {
      // Table Surface
      child.attrs['data-role'] = 'table-surface';
      child.attrs['fill'] = catColors.tableFill;
      child.attrs['stroke'] = catColors.stroke;
    } else {
      // Chairs
      child.attrs['fill'] = catColors.chairFill;
      child.attrs['stroke'] = catColors.stroke;
    }
  }

  // Remove static text outline paths (T# and seats/taken) so React text renders cleanly
  groupNode.children = children.slice(0, tIndex);
}

// ─── 5. Output Files ──────────────────────────────────────────────────────────

// 1. Prepared SVG
const preparedSvg = serializeNodeToSvg(tree);
fs.writeFileSync(outputPreparedSvgPath, preparedSvg, 'utf8');
console.log(`Saved prepared SVG to ${outputPreparedSvgPath}`);

// 2. Generated Table Metadata
const positionsTsCode = `// Generated automatically by scripts/prepare-restaurant-svg.mjs
// DO NOT EDIT DIRECTLY. Re-generate with: npm run prepare:restaurant

export type GeneratedTablePosition = {
  x: number;
  labelY: number;
  statusY: number;
  capacity: number;
};

export const GENERATED_TABLE_POSITIONS: Record<string, GeneratedTablePosition> = ${JSON.stringify(
  tablePositions,
  null,
  2
)};

export const GENERATED_DEFAULT_TABLES = ${JSON.stringify(
  tableMetadataList.map(t => ({ id: t.id, capacity: t.capacity, taken: false })),
  null,
  2
)};
`;
fs.writeFileSync(outputPositionsJsonPath, positionsTsCode, 'utf8');
console.log(`Saved generated table metadata to ${outputPositionsJsonPath}`);

// 3. React TSX Component
const jsxContent = serializeNodeToJsx(tree);
const tsxCode = `// Generated automatically by scripts/prepare-restaurant-svg.mjs
// DO NOT EDIT DIRECTLY. Re-generate with: npm run prepare:restaurant

import React from 'react';

export interface RestaurantLayoutSvgProps extends React.SVGProps<SVGSVGElement> {}

export function RestaurantLayoutSvg(props: RestaurantLayoutSvgProps) {
  return (
${jsxContent}
  );
}

export default RestaurantLayoutSvg;
`;
fs.writeFileSync(outputTsxPath, tsxCode, 'utf8');
console.log(`Generated React component at ${outputTsxPath}`);
console.log('SVG preparation pipeline completed successfully!');
