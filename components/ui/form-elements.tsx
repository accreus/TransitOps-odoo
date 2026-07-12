"use client";

import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
          {props.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full h-9 px-3 bg-background border rounded-sm text-sm text-foreground",
          "placeholder:text-muted-foreground/60",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors duration-100",
          error ? "border-destructive" : "border-input",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
          {props.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full h-9 px-3 bg-background border rounded-sm text-sm text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors duration-100",
          error ? "border-destructive" : "border-input",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
          {props.required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full px-3 py-2 bg-background border rounded-sm text-sm text-foreground",
          "placeholder:text-muted-foreground/60",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors duration-100 min-h-[80px] resize-y",
          error ? "border-destructive" : "border-input",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
