'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type DrawerSide = 'right' | 'left';
type DrawerScope = 'viewport' | 'container';

export function Drawer({
    open,
    onClose,
    side = 'right',
    widthClassName = 'w-full sm:w-[420px]',
    children,
    scope = 'viewport',
    className = '',
    backdropClassName = '',
    panelClassName = '',
}: {
    open: boolean;
    onClose: () => void;
    side?: DrawerSide;
    widthClassName?: string;
    children: React.ReactNode;
    scope?: DrawerScope;
    className?: string;
    backdropClassName?: string;
    panelClassName?: string;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    // When the drawer is open, prevent the page behind it from scrolling (viewport scope only).
    useEffect(() => {
        if (!open || scope !== 'viewport') return;
        const prev = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.documentElement.style.overflow = prev;
        };
    }, [open, scope]);

    const rootClassName = useMemo(() => {
        const base =
            scope === 'viewport'
                ? 'fixed inset-0 z-[100]'
                : 'absolute inset-0 z-40';
        return [
            base,
            open ? 'pointer-events-auto' : 'pointer-events-none',
            className,
        ].join(' ');
    }, [scope, open, className]);

    const content = (
        <div
            className={rootClassName}
            aria-hidden={!open}
        >
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className={[
                    'absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity',
                    open ? 'opacity-100' : 'opacity-0',
                    backdropClassName,
                ].join(' ')}
            />

            {/* Panel */}
            <div
                className={[
                    'absolute inset-y-0 bg-white shadow-2xl border-l border-gray-200',
                    widthClassName,
                    side === 'right' ? 'right-0' : 'left-0 border-l-0 border-r border-gray-200',
                    'transition-transform duration-200 ease-out',
                    open
                        ? 'translate-x-0'
                        : side === 'right'
                            ? 'translate-x-full'
                            : '-translate-x-full',
                    panelClassName,
                ].join(' ')}
                role="dialog"
                aria-modal="true"
            >
                <div className="h-full w-full overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );

    if (scope === 'container') return content;
    if (!mounted) return null;
    return createPortal(content, document.body);
}

