import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { ChevronDown } from "lucide-react";

export function Select({ value, onChange, children, className = "" }) {
  return (
    <div className={cn("relative", className)}>
      {children({ value, onChange })}
    </div>
  );
}

export function SelectTrigger({ placeholder, value, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="h-9 w-full rounded-md border bg-background px-3 text-sm flex items-center justify-between shadow-sm hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className={cn("truncate text-left", !value && "text-muted-foreground")}>{value || placeholder}</span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </button>
  );
}

export function SelectContent({ open, onClose, children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  return open ? (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      data-state={open ? "open" : "closed"}
      role="listbox"
    >
      {children}
    </div>
  ) : null;
}

export function SelectItem({ children, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
      role="option"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.();
      }}
    >
      {children}
    </div>
  );
}


