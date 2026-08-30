'use client';

import React, { useEffect, useRef } from 'react';
import RestaurantLayoutSvg from './RestaurantLayoutSvg';
import {
  GENERATED_DEFAULT_TABLES,
  GENERATED_TABLE_POSITIONS,
  GeneratedTablePosition,
} from './table-positions.generated';
import './RestaurantLayout.css';

export type RestaurantTable = {
  id: string;
  capacity: number;
  taken: boolean;
  /** Custom text shown above the capacity, defaults to the table id (e.g. "T1"). */
  label?: string;
};

export type RestaurantLayoutProps = {
  /** Array of tables with their taken status and capacities. */
  tables?: RestaurantTable[];
  /** Currently selected table ID (e.g. "T1"). */
  selectedTableId?: string | null;
  /** Callback triggered when an available table is clicked. */
  onTableSelect?: (table: RestaurantTable) => void;
  /** Optional custom class name. */
  className?: string;
};

export function RestaurantLayout({
  tables = GENERATED_DEFAULT_TABLES,
  selectedTableId = null,
  onTableSelect,
  className = '',
}: RestaurantLayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Map of tables by ID for fast lookup
  const tableMap = React.useMemo(() => {
    const map = new Map<string, RestaurantTable>();
    for (const t of tables) {
      map.set(t.id, t);
    }
    return map;
  }, [tables]);

  // Synchronize visual state (data-state and CSS class modifiers) on SVG groups
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tableGroups = root.querySelectorAll<SVGGElement>('[data-table-id]');
    tableGroups.forEach((group) => {
      const id = group.dataset.tableId;
      if (!id) return;

      const table = tableMap.get(id);
      const isTaken = table ? table.taken : false;
      const isSelected = selectedTableId === id;
      const state = !table ? 'disabled' : isTaken ? 'taken' : isSelected ? 'selected' : 'available';

      group.dataset.state = state;
      group.classList.remove(
        'restaurant-table--available',
        'restaurant-table--taken',
        'restaurant-table--selected',
        'restaurant-table--disabled'
      );
      group.classList.add(`restaurant-table--${state}`);
    });
  }, [tableMap, selectedTableId]);

  // Generic delegated click handler on root container
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element | null;
    if (!target) return;

    const group = target.closest<SVGGElement>('[data-table-id]');
    if (!group) return;

    const id = group.dataset.tableId;
    if (!id) return;

    const table = tableMap.get(id);
    if (!table || table.taken) return;

    onTableSelect?.(table);
  };

  return (
    <div
      ref={rootRef}
      className={`restaurant-layout ${className}`}
      onClick={handleClick}
      role="region"
      aria-label="Restaurant seating plan"
    >
      {/* Base static artwork with semantic data attributes */}
      <RestaurantLayoutSvg
        className="restaurant-layout__svg"
        aria-hidden="true"
      />

      {/* Dynamic React text overlay aligned with SVG viewBox */}
      <svg
        className="restaurant-layout__overlay"
        viewBox="0 0 562 660"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {tables.map((table) => {
          const pos: GeneratedTablePosition | undefined = GENERATED_TABLE_POSITIONS[table.id];
          if (!pos) return null;

          const isSelected = selectedTableId === table.id;
          const label = table.label ?? table.id;
          const status = table.taken ? 'Taken' : `${table.capacity} seats`;

          return (
            <g
              key={table.id}
              className={`restaurant-layout__label-group ${
                table.taken
                  ? 'restaurant-layout__label-group--taken'
                  : isSelected
                    ? 'restaurant-layout__label-group--selected'
                    : 'restaurant-layout__label-group--available'
              }`}
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
  );
}

export default RestaurantLayout;
