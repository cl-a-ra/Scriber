import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ThemeConfig } from '../lib/themeStyles';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  themeConfig: ThemeConfig;
  darkMode: boolean;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, themeConfig, darkMode, children }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !dialog.matches(':modal')) return;
      event.preventDefault();
      event.stopPropagation();
      closeRef.current();
    };
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <dialog ref={dialogRef} aria-label={title} className="sanctuary-sheet"
      onCancel={(event) => { event.preventDefault(); closeRef.current(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeRef.current();
      }}
      style={{
        backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
        color: darkMode ? themeConfig.textDark : themeConfig.textLight,
        borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
      }}>
      <div className="shrink-0 px-5 sm:px-7 pt-3 pb-4 border-b" style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}>
        <div aria-hidden="true" className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mx-auto mb-4" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="min-w-11 min-h-11 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="sheet-content overflow-y-auto overscroll-contain p-5 sm:p-7">{children}</div>
    </dialog>
  );
}

export function useCompactLayout() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return isMobile;
}

export function ResponsiveSheet({ isOpen, onClose, title, themeConfig, darkMode, children, inlineClassName }: BottomSheetProps & { inlineClassName?: string }) {
  const isMobile = useCompactLayout();
  if (isMobile) return <BottomSheet isOpen={isOpen} onClose={onClose} title={title} themeConfig={themeConfig} darkMode={darkMode}>{children}</BottomSheet>;
  return <div className={inlineClassName || 'lg:col-span-5 space-y-5 rounded-2xl p-5 sm:p-6 border shadow-xs'} style={{
    backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
    borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
  }}>{children}</div>;
}
