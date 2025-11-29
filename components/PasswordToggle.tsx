import React, { useState, useRef } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
}

const EyeIcon = ({ open }: { open: boolean }) => (
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-8 1.06-3.01 3.6-5.41 6.62-6.47"/>
      <path d="M1 1l22 22" />
      <path d="M9.53 9.53A3 3 0 0 0 14.47 14.47" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
);

const PasswordToggle: React.FC<Props> = ({ className = '', id, ...rest }) => {
  const [visible, setVisible] = useState(false);
  const holdPrevRef = useRef<boolean | null>(null);
  const inputClass = `${className} pr-10`; // reserve space for the toggle

  const handleMouseDown = () => {
    // Save previous visible state and temporarily reveal while held
    holdPrevRef.current = visible;
    setVisible(true);
  };

  const restoreAfterHold = () => {
    if (holdPrevRef.current === null) return;
    setVisible(holdPrevRef.current);
    holdPrevRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Toggle persistent visibility on Enter
      setVisible(v => !v);
    } else if (e.key === ' ') {
      // Space acts like press-and-hold
      e.preventDefault();
      holdPrevRef.current = visible;
      setVisible(true);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      restoreAfterHold();
    }
  };

  return (
    <div className="relative">
      <input id={id} {...rest} type={visible ? 'text' : 'password'} className={inputClass} />
      <button
        type="button"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        onClick={() => setVisible(v => !v)}
        onMouseDown={handleMouseDown}
        onMouseUp={restoreAfterHold}
        onMouseLeave={restoreAfterHold}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
};

export default PasswordToggle;
