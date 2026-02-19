'use client';

import { useState, useRef, useEffect } from 'react';

export type ModelOption = {
  id: string;
  label: string;
  badge?: 'recommended' | 'fast' | 'quality';
};

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', badge: 'recommended' },
  { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B', badge: 'quality' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', badge: 'fast' },
  { id: 'llama-3.3-70b-specdec', label: 'Llama 3.3 70B Speculative', badge: 'quality' },
  { id: 'llama-3.2-3b-preview', label: 'Llama 3.2 3B Preview', badge: 'fast' },
  { id: 'llama-3.2-90b-vision-preview', label: 'Llama 3.2 90B Vision', badge: 'quality' },
];

type ChatInputProps = {
  onSend: (content: string, model: string) => void;
  disabled: boolean;
};

const ADD_OPTIONS = [
  { id: 'files', label: 'Add files or photos', icon: 'paperclip' },
] as const;

const ADD_OPTIONS_BOTTOM = [
  { id: 'websearch', label: 'Web search', icon: 'globe' },
  { id: 'connectors', label: 'Add connectors', icon: 'grid' },
] as const;

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconFor({ name }: { name: string }) {
  const c = 'w-4 h-4 text-gray-500 shrink-0';
  switch (name) {
    case 'paperclip':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      );
    case 'camera':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'folder':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'globe':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'feather':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
          <line x1="16" y1="8" x2="2" y2="22" />
          <line x1="17.5" y1="15" x2="9" y2="15" />
        </svg>
      );
    case 'grid':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    default:
      return null;
  }
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Badge({ type }: { type: NonNullable<ModelOption['badge']> }) {
  const styles = {
    recommended: 'bg-indigo-100 text-indigo-700',
    fast: 'bg-emerald-100 text-emerald-700',
    quality: 'bg-amber-100 text-amber-700',
  };
  const labels = { recommended: 'Best', fast: 'Fast', quality: 'Quality' };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [model, setModel] = useState(MODEL_OPTIONS[0].id);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [value]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!plusOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
        setPlusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [plusOpen]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, model);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const currentOption = MODEL_OPTIONS.find((o) => o.id === model) ?? MODEL_OPTIONS[0];

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 flex items-end gap-0 rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
        <div className="relative shrink-0 self-center pl-1" ref={plusRef}>
          <button
            type="button"
            onClick={() => !disabled && setPlusOpen((o) => !o)}
            disabled={disabled}
            title="Add files, connectors, and more"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          {plusOpen && (
            <div className="absolute left-0 bottom-full mb-1 w-56 rounded-xl bg-white border border-gray-200 shadow-lg py-1.5 z-[100]">
              <ul className="py-0.5">
                {ADD_OPTIONS.map((opt) => (
                  <li key={opt.id}>
                    <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed">
                      <IconFor name={opt.icon} />
                      <span className="flex-1">{opt.label}</span>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Coming soon</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 my-1" />
              <ul className="py-0.5">
                {ADD_OPTIONS_BOTTOM.map((opt) => (
                  <li key={opt.id}>
                    <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed">
                      <IconFor name={opt.icon} />
                      <span className="flex-1">{opt.label}</span>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Coming soon</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a URL or ask an SEO question..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border-0 py-3 pr-4 pl-1 text-sm focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:text-gray-400 min-w-0 bg-transparent"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19V5m0 0l-7 7m7-7l7 7"
          />
        </svg>
      </button>

      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setDropdownOpen((o) => !o)}
          disabled={disabled}
          className="h-11 pl-3 pr-9 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 flex items-center gap-2 min-w-[140px] hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <span className="truncate">{currentOption.label}</span>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-xl bg-white border border-gray-200 shadow-lg py-1.5 z-50 overflow-hidden">
            <div className="px-2.5 py-1.5 border-b border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Model</p>
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {MODEL_OPTIONS.map((opt) => {
                const isSelected = opt.id === model;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setModel(opt.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-5 flex justify-center shrink-0">
                        {isSelected ? <CheckIcon className="w-4 h-4 text-indigo-600" /> : null}
                      </span>
                      <span className="flex-1 truncate font-medium">{opt.label}</span>
                      {opt.badge && <Badge type={opt.badge} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
