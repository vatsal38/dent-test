"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TruncatedWithTooltipProps = {
  text: string;
  className?: string;
  maxWidthClass?: string;
  /** Native + floating tooltip when text is the loading placeholder */
  loadingTitle?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
};

function shouldUseFloatingTooltip(text: string, el: HTMLElement | null): boolean {
  if (!text || text === "—") return false;
  if (text.length > 28) return true;
  if (text.includes(",") || text.includes("\n")) return true;
  if (!el) return false;
  return el.scrollWidth > el.clientWidth + 1;
}

export function TruncatedWithTooltip({
  text,
  className = "text-sm text-gray-700",
  maxWidthClass = "max-w-[240px]",
  loadingTitle = "Loading linked record names…",
  href,
  onClick,
}: TruncatedWithTooltipProps) {
  const ref = useRef<HTMLSpanElement | HTMLAnchorElement>(null);
  const [mounted, setMounted] = useState(false);
  const [floating, setFloating] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  const tooltipText = text === "…" ? loadingTitle : text;

  const openTooltip = useCallback(() => {
    const el = ref.current;
    if (!tooltipText || tooltipText === "—") return;
    const isLoading = text === "…";
    if (!isLoading && !shouldUseFloatingTooltip(tooltipText, el)) return;
    const rect = el!.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - 328);
    setFloating({
      x: Math.min(rect.left, maxLeft),
      y: rect.bottom + 6,
      label: tooltipText,
    });
  }, [text, tooltipText]);

  const closeTooltip = useCallback(() => setFloating(null), []);

  if (text === "—") {
    return <span className="text-xs text-gray-300">—</span>;
  }

  const sharedClass = `truncate block ${maxWidthClass} ${className} ${
    tooltipText && tooltipText !== "—" ? "cursor-help" : ""
  }`;

  const handlers = {
    onMouseEnter: openTooltip,
    onMouseLeave: closeTooltip,
    onFocus: openTooltip,
    onBlur: closeTooltip,
    title: tooltipText,
  };

  const inner = href ? (
    <a
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={href}
      onClick={onClick}
      className={sharedClass}
      {...handlers}
    >
      {text}
    </a>
  ) : (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={sharedClass} {...handlers}>
      {text}
    </span>
  );

  return (
    <>
      {inner}
      {mounted &&
        floating &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[200] max-w-sm rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-xl whitespace-pre-wrap break-words"
            style={{ left: floating.x, top: floating.y }}
          >
            {floating.label}
          </div>,
          document.body,
        )}
    </>
  );
}
