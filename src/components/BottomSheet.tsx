import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ title, subtitle, onClose, children }) => {
  const [isClosing, setIsClosing] = useState(false);
  const titleId = useId();
  const subtitleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isClosingRef = useRef(false);

  const requestClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, 210);
  };

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'));

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <div
      onClick={requestClose}
      className={`fixed inset-0 z-50 flex items-end justify-center bg-[#17231F]/60 backdrop-blur-[2px] sm:p-4 ${isClosing ? 'sheet-backdrop-exit' : 'sheet-backdrop-enter'}`}
    >
      <section
        ref={panelRef}
        tabIndex={-1}
        onClick={(event: React.MouseEvent<HTMLElement>) => event.stopPropagation()}
        className={`max-h-[88dvh] w-full max-w-md overflow-hidden rounded-t-[32px] bg-[#FFFBF2] shadow-2xl outline-none sm:rounded-[32px] ${isClosing ? 'sheet-panel-exit' : 'sheet-panel-enter'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
      >
        <div className="mx-auto mt-2 h-1 w-11 rounded-full bg-[#BFC9C0]" />
        <div className="flex items-start justify-between gap-3 border-b border-[#D9E0D8] px-5 pb-4 pt-3">
          <div>
            <h2 id={titleId} className="font-serif-header text-[26px] font-bold leading-tight text-[#18241F]">{title}</h2>
            {subtitle && <p id={subtitleId} className="mt-1 text-xs font-medium leading-5 text-[#627066]">{subtitle}</p>}
          </div>
          <button ref={closeButtonRef} type="button" onClick={requestClose} className="grid h-11 w-11 shrink-0 touch-manipulation place-items-center rounded-full text-[#627066] transition-colors hover:bg-[#F0EEE5] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#405047]/20" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="hide-scrollbar max-h-[calc(88dvh-96px)] overflow-y-auto overscroll-contain p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </section>
    </div>
  );
};
