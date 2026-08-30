'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import RestaurantLayoutSvg from './RestaurantLayoutSvg';
import {
  GENERATED_DEFAULT_TABLES,
  GENERATED_TABLE_POSITIONS,
  GeneratedTablePosition,
} from './table-positions.generated';
import './RestaurantLayout.css';

// ─── Types & Palettes (from seating-plan.tsx) ───────────────────────────────────

export type Seats = 2 | 4 | 6 | 8;

export type RestaurantTable = {
  id: string;
  capacity: number;
  taken: boolean;
  /** Custom text shown above the capacity, defaults to the table id (e.g. "T1"). */
  label?: string;
};

export type PaletteEntry = {
  color: string;
  fill: string;
  text: string;
  chipText: string;
  label: string;
};

export const PALETTE: Record<Seats, { light: PaletteEntry; dark: PaletteEntry }> = {
  2: {
    light: { color: '#C4613A', fill: '#FAEAE2', text: '#9A3F1F', chipText: '#ffffff', label: 'Duo' },
    dark:  { color: '#E07A52', fill: '#2D180E', text: '#F0A882', chipText: '#141009', label: 'Duo' },
  },
  4: {
    light: { color: '#6B7C45', fill: '#EDF0E1', text: '#4A5A28', chipText: '#ffffff', label: 'Classic' },
    dark:  { color: '#8A9E5C', fill: '#1C2210', text: '#B4C882', chipText: '#141009', label: 'Classic' },
  },
  6: {
    light: { color: '#9B7A3A', fill: '#F5EDD8', text: '#6D5218', chipText: '#ffffff', label: 'Social' },
    dark:  { color: '#C49A52', fill: '#261C08', text: '#DEC088', chipText: '#141009', label: 'Social' },
  },
  8: {
    light: { color: '#7A5C4A', fill: '#EEE4DC', text: '#543C2C', chipText: '#ffffff', label: 'Banquet' },
    dark:  { color: '#A87A62', fill: '#221510', text: '#D4A48A', chipText: '#141009', label: 'Banquet' },
  },
};

const DARK_THEMES = new Set(['dark', 'neon']);

export const FILTER_OPTS = [
  { val: 0, label: 'All' },
  { val: 2, label: '2 Seats' },
  { val: 4, label: '4 Seats' },
  { val: 6, label: '6 Seats' },
  { val: 8, label: '8 Seats' },
];

export type RestaurantLayoutProps = {
  /** Array of tables with their taken status and capacities. */
  tables?: RestaurantTable[];
  /** Currently selected table ID (e.g. "T1"). */
  selectedTableId?: string | null;
  /** Active seat capacity filter (0 or null for All, or 2, 4, 6, 8). */
  capacityFilter?: number | null;
  /** Whether to show the top filter pill header bar (default: true). */
  showFilterBar?: boolean;
  /** Callback triggered when an available table is clicked. */
  onTableSelect?: (table: RestaurantTable) => void;
  /** Callback triggered when capacity filter changes. */
  onCapacityFilterChange?: (capacity: number) => void;
  /** Optional custom class name. */
  className?: string;
};

export function RestaurantLayout({
  tables = GENERATED_DEFAULT_TABLES,
  selectedTableId = null,
  capacityFilter: externalFilter,
  showFilterBar = true,
  onTableSelect,
  onCapacityFilterChange,
  className = '',
}: RestaurantLayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalFilter, setInternalFilter] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFilter = externalFilter !== undefined && externalFilter !== null ? externalFilter : internalFilter;
  const isDark = mounted ? DARK_THEMES.has(resolvedTheme ?? '') : false;

  const handleFilterClick = (val: number) => {
    setInternalFilter(val);
    onCapacityFilterChange?.(val);
  };

  // Map of tables by ID for fast lookup
  const tableMap = React.useMemo(() => {
    const map = new Map<string, RestaurantTable>();
    for (const t of tables) {
      map.set(t.id, t);
    }
    return map;
  }, [tables]);

  // Synchronize visual state (data-state, data-filtered, and CSS class modifiers) on SVG groups
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tableGroups = root.querySelectorAll<SVGGElement>('[data-table-id]');
    tableGroups.forEach((group) => {
      const id = group.dataset.tableId;
      if (!id) return;

      const table = tableMap.get(id);
      const capacity = table?.capacity ?? parseInt(group.dataset.capacity || '2', 10);
      const isFilteredOut = activeFilter !== 0 && capacity !== activeFilter;

      const isTaken = table ? table.taken : false;
      const isSelected = selectedTableId === id;
      const state = !table ? 'disabled' : isTaken ? 'taken' : isSelected ? 'selected' : 'available';

      group.dataset.state = state;
      group.dataset.filtered = isFilteredOut ? 'true' : 'false';

      group.classList.remove(
        'restaurant-table--available',
        'restaurant-table--taken',
        'restaurant-table--selected',
        'restaurant-table--disabled',
        'restaurant-table--filtered-out'
      );
      group.classList.add(`restaurant-table--${state}`);
      if (isFilteredOut) {
        group.classList.add('restaurant-table--filtered-out');
      }
    });
  }, [tableMap, selectedTableId, activeFilter]);

  // Generic delegated click handler on root container
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element | null;
    if (!target) return;

    const group = target.closest<SVGGElement>('[data-table-id]');
    if (!group) return;

    // Check if table is filtered out
    if (group.dataset.filtered === 'true') return;

    const id = group.dataset.tableId;
    if (!id) return;

    const table = tableMap.get(id);
    if (!table || table.taken) return;

    onTableSelect?.(table);
  };

  // Find position and palette of currently selected table for the dashed halo
  const selectedTable = selectedTableId ? tableMap.get(selectedTableId) : null;
  const selectedPos: GeneratedTablePosition | undefined = selectedTableId
    ? GENERATED_TABLE_POSITIONS[selectedTableId]
    : undefined;
  const selectedSeats = (selectedTable?.capacity ?? selectedPos?.capacity ?? 2) as Seats;
  const selectedPalette = PALETTE[selectedSeats] ? (isDark ? PALETTE[selectedSeats].dark : PALETTE[selectedSeats].light) : null;

  const isSelectedFilteredOut = activeFilter !== 0 && selectedSeats !== activeFilter;

  return (
    <div className={`restaurant-layout-card ${className}`}>
      {/* ─── Filter Pills Header Bar ─────────────────────────────────────────── */}
      {showFilterBar && (
        <div className="restaurant-layout__filter-bar">
          <span className="restaurant-layout__filter-label">Filter</span>
          {FILTER_OPTS.map((opt) => {
            const active = activeFilter === opt.val;
            const p = opt.val !== 0 ? (isDark ? PALETTE[opt.val as Seats].dark : PALETTE[opt.val as Seats].light) : null;

            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => handleFilterClick(opt.val)}
                className={`restaurant-layout__filter-pill ${active ? 'restaurant-layout__filter-pill--active' : ''}`}
                style={
                  active && p
                    ? { background: p.color, borderColor: p.color, color: p.chipText }
                    : active
                      ? {
                          background: 'var(--color-primary, #c4613a)',
                          borderColor: 'var(--color-primary, #c4613a)',
                          color: '#ffffff',
                        }
                      : {}
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Floor Plan Layout Viewport ───────────────────────────────────────── */}
      <div
        ref={rootRef}
        className="restaurant-layout"
        onClick={handleClick}
        role="region"
        aria-label="Restaurant seating floor plan"
      >
        {/* Base static SVG artwork */}
        <RestaurantLayoutSvg className="restaurant-layout__svg" aria-hidden="true" />

        {/* Dynamic React text overlay and dashed selection halo */}
        <svg
          className="restaurant-layout__overlay"
          viewBox="0 0 562 660"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Dashed Selection Halo Ring around active table (hidden if table is filtered out) */}
          {selectedPos && selectedPalette && !isSelectedFilteredOut && (
            <g className="restaurant-layout__selection-halo" pointerEvents="none">
              {selectedSeats === 6 ? (
                // 6-seater round table halo
                <circle
                  cx={selectedPos.x}
                  cy={selectedPos.labelY + 7}
                  r={50}
                  fill="none"
                  stroke={selectedPalette.color}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              ) : selectedSeats === 8 ? (
                // 8-seater banquet table halo
                <rect
                  x={selectedPos.x - 74}
                  y={selectedPos.labelY + 7 - 40}
                  width={148}
                  height={80}
                  rx={9}
                  fill="none"
                  stroke={selectedPalette.color}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              ) : selectedSeats === 4 ? (
                // 4-seater square table halo
                <rect
                  x={selectedPos.x - 44}
                  y={selectedPos.labelY + 7 - 44}
                  width={88}
                  height={88}
                  rx={9}
                  fill="none"
                  stroke={selectedPalette.color}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              ) : (
                // 2-seater rectangle table halo (Unchanged)
                <rect
                  x={selectedPos.x - 29}
                  y={selectedPos.labelY + 7 - 34}
                  width={58}
                  height={68}
                  rx={7}
                  fill="none"
                  stroke={selectedPalette.color}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              )}
            </g>
          )}

          {/* Dynamic Table Number & Status Labels */}
          {tables.map((table) => {
            const pos: GeneratedTablePosition | undefined = GENERATED_TABLE_POSITIONS[table.id];
            if (!pos) return null;

            const isFilteredOut = activeFilter !== 0 && table.capacity !== activeFilter;
            const isSelected = selectedTableId === table.id;
            const label = table.label ?? table.id;
            const status = table.taken ? 'Taken' : `${table.capacity} seats`;

            return (
              <g
                key={table.id}
                data-capacity={table.capacity}
                className={`restaurant-layout__label-group ${
                  isFilteredOut
                    ? 'restaurant-layout__label-group--filtered-out'
                    : table.taken
                      ? 'restaurant-layout__label-group--taken'
                      : isSelected
                        ? 'restaurant-layout__label-group--selected'
                        : 'restaurant-layout__label-group--available'
                }`}
                style={{
                  transformOrigin: `${pos.x}px ${pos.labelY + 7}px`,
                }}
                pointerEvents="none"
              >
                <text
                  x={pos.x}
                  y={pos.labelY}
                  textAnchor="middle"
                  className="restaurant-layout__table-label"
                >
                  {label}
                </text>
                <text
                  x={pos.x}
                  y={pos.statusY}
                  textAnchor="middle"
                  className="restaurant-layout__status-label"
                >
                  {status}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default RestaurantLayout;
