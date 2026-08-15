"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  disabledBadge?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyGuidance?: string;
  emptyActionUrl?: string;
  emptyActionLabel?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  onDisabledSelect?: (option: SelectOption) => void;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  emptyGuidance = "Create a widget first to select a target",
  emptyActionUrl = "/widgets",
  emptyActionLabel = "Create Widget",
  disabled = false,
  className = "",
  id,
  onDisabledSelect,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // If options list is empty, show inline guidance instead of an empty broken control
  if (options.length === 0) {
    return (
      <div className="w-full p-3.5 bg-surface-light border border-ink-900/15 rounded-xl text-xs flex items-center justify-between gap-3 text-ink-800/80">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-ink-900 flex-shrink-0" />
          <span>{emptyGuidance}</span>
        </div>
        {emptyActionUrl && (
          <Link
            href={emptyActionUrl}
            className="px-2.5 py-1 bg-ink-900 hover:bg-ink-800 text-surface-white font-medium rounded-lg text-[11px] whitespace-nowrap transition"
          >
            {emptyActionLabel}
          </Link>
        )}
      </div>
    );
  }

  // Handle click outside to close listbox
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelectOption = (option: SelectOption) => {
    if (option.disabled) {
      if (onDisabledSelect) {
        onDisabledSelect(option);
      }
      return;
    }
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        const idx = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      } else if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelectOption(options[highlightedIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(options.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3.5 py-2.5 border border-ink-900/20 rounded-xl text-sm bg-surface-white text-ink-900 flex items-center justify-between gap-2 text-left focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:outline-none focus:border-ink-900 transition ${
          disabled ? "opacity-50 cursor-not-allowed bg-surface-light" : "cursor-pointer hover:border-ink-900/40"
        }`}
      >
        <span className={selectedOption ? "text-ink-900 font-medium truncate" : "text-ink-800/50 truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-ink-800/60 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-surface-white border border-ink-900/15 rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-up"
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectOption(option)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3.5 py-2 text-sm cursor-pointer transition flex items-center justify-between gap-2 ${
                  option.disabled ? "opacity-60 bg-surface-light/40" : "hover:bg-surface-light"
                } ${isSelected ? "bg-surface-light font-semibold text-ink-900" : "text-ink-900"} ${
                  isHighlighted && !isSelected ? "bg-surface-light/70" : ""
                }`}
              >
                <span className="truncate">{option.label}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {option.disabledBadge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-light border border-ink-800/20 text-ink-800 rounded font-bold uppercase">
                      {option.disabledBadge}
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-ink-900" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
