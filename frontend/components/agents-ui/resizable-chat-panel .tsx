"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import AgentChatUI from "@/components/AgentChatUI";

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

export default function ResizableChatPanel() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
      setIsCollapsed(false);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const collapsed = isCollapsed;
  const panelWidth = collapsed ? 0 : width;

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Chat Panel ── */}
      <div
        className="h-full flex-shrink-0 overflow-hidden transition-[width] duration-200"
        style={{ width: collapsed ? 0 : width }}
      >
        {!collapsed && <AgentChatUI />}
      </div>

      {/* ── Drag Handle ── */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center group"
        style={{ width: 12, cursor: "col-resize", zIndex: 10 }}
        onMouseDown={onMouseDown}
      >
        {/* Track line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary transition-colors duration-150" />

        {/* Toggle button */}
        <button
          onClick={() => setIsCollapsed(c => !c)}
          className="relative z-10 w-7 h-7 rounded-full bg-primary text-primary-fg flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-150 text-xs font-bold select-none"
          title={collapsed ? "Open chat" : "Close chat"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 h-full overflow-auto">
        {/* Baaki page content yahan */}
      </div>

    </div>
  );
}