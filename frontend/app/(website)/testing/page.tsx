"use client";

import React, { useState } from "react";
import { RestaurantLayout, RestaurantTable } from "@/components/website/booking/RestaurantLayout";
import { GENERATED_DEFAULT_TABLES } from "@/components/website/booking/table-positions.generated";

export default function TestingPage() {
  const [tables, setTables] = useState<RestaurantTable[]>(() =>
    GENERATED_DEFAULT_TABLES.map((t) => ({
      ...t,
      taken: t.id === "T2" || t.id === "T8" || t.id === "T17",
    }))
  );

  const [selectedTableId, setSelectedTableId] = useState<string | null>("T1");

  const toggleTableTaken = (id: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, taken: !t.taken } : t))
    );
    if (selectedTableId === id) {
      setSelectedTableId(null);
    }
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  return (
    <div className="min-h-screen px-8 py-12 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Layout Pipeline Test</h1>
          <p className="text-sm text-text-muted mt-1">
            Testing dynamic SVG preparation, event delegation, and real-time state synchronization.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Seating Layout Floor Plan */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Floor Plan Component</h2>
            <RestaurantLayout
              tables={tables}
              selectedTableId={selectedTableId}
              onTableSelect={(table) => {
                setSelectedTableId(table.id);
              }}
            />
          </div>

          {/* Testing Controls & State Monitor */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Selected Table State</h2>
              {selectedTable ? (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-primary">
                      Table {selectedTable.id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                      Selected
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Capacity: <span className="font-semibold text-foreground">{selectedTable.capacity} seats</span>
                  </p>
                  <p className="text-sm text-text-secondary">
                    Status: <span className="font-semibold text-emerald-600">Available</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedTableId(null)}
                    className="mt-2 text-xs text-primary underline hover:opacity-80 cursor-pointer bg-transparent border-none p-0"
                  >
                    Deselect table
                  </button>
                </div>
              ) : (
                <p className="text-sm text-text-muted italic">No table selected. Click an available table on the layout.</p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Toggle Table Availability</h2>
              <p className="text-xs text-text-muted mb-3">Click any table below to toggle its taken/available state:</p>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTableTaken(t.id)}
                    className={`px-2 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                      t.taken
                        ? "bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20"
                    }`}
                  >
                    {t.id}: {t.taken ? "Taken" : "Free"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}