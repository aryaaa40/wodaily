import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, footer, children, wide }: ModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    const target =
      bodyRef.current?.querySelector<HTMLElement>('input, textarea') ??
      footerRef.current?.querySelector<HTMLElement>('button');
    target?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      opener?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={wide ? `${styles.panel} ${styles.panelWide}` : styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className="btn btn--icon"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        <div ref={bodyRef} className={styles.body}>
          {children}
        </div>
        <div ref={footerRef} className={styles.footer}>
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}
