import React from "react";

export interface InputProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "tel" | "date" | "textarea" | "select";
  value: string;
  onChange: (e: any) => void;
  options?: { label: string; value: string }[];
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export default function Input({ 
  label, name, type = "text", value, onChange, options, hint, error, required, placeholder, className = "", rows = 4 
}: InputProps) {
  const baseClasses = `w-full bg-panel border ${error ? 'border-danger' : 'border-strong-line'} text-text rounded-[7px] p-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-sm`;

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-muted text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
        {label} {required && <span className="text-danger text-lg leading-none mt-1">*</span>}
      </label>
      
      {type === "textarea" ? (
        <textarea 
          className={`${baseClasses} resize-y min-h-[100px]`}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows}
        />
      ) : type === "select" ? (
        <select
          className={`${baseClasses} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center] bg-[length:16px_16px] pr-10`}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        >
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type}
          className={baseClasses}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
        />
      )}
      
      {hint && !error && <span className="text-[11px] text-muted mt-1.5">{hint}</span>}
      {error && <span className="text-[11px] text-danger mt-1.5">{error}</span>}
    </div>
  );
}
