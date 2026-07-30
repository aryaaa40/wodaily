import { useState } from 'react';
import { Modal } from './Modal';
import styles from './Modal.module.css';

interface TextPromptModalProps {
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  context?: { label: string; value: string }[];
  submitLabel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function TextPromptModal({
  title,
  label,
  placeholder,
  defaultValue = '',
  context,
  submitLabel,
  onSubmit,
  onClose,
}: TextPromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const trimmed = value.trim();

  const submit = () => {
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide={Boolean(context?.length)}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={submit}
            disabled={!trimmed}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      {context?.length ? (
        <div className={styles.context}>
          {context.map((item) => (
            <div key={item.label}>
              <span className={styles.contextLabel}>{item.label}</span>
              <p className={styles.contextValue}>{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{label}</span>
        <textarea
          className="textarea"
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit();
          }}
        />
      </label>
    </Modal>
  );
}
