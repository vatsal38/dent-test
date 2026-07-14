"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Full-viewport headshot zoom. Portaled to body so drawer overflow/transform
 * cannot clip the photo (ticket 37B).
 */
export function HeadshotLightbox({
  open,
  src,
  alt,
  onClose,
}: {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !src || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/15 text-white text-xl hover:bg-white/25"
        onClick={onClose}
        aria-label="Close headshot"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[92vh] max-w-[min(100%,92vw)] w-auto h-auto rounded-lg shadow-2xl object-contain"
        referrerPolicy="no-referrer"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
