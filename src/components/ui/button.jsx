import { cn } from "../../utils/cn";

const variants = {
  // Primary: purple gradient accent matching Obys-like theme
  default:
    "bg-gradient-to-r from-[#7c5cff] to-[#4f46e5] text-white shadow-lg hover:brightness-95",
  // Secondary: subtle light-on-dark card
  secondary: "bg-white/6 text-white/90 border border-white/6 hover:bg-white/8",
  // Ghost: transparent but visible on dark backgrounds
  ghost: "bg-transparent hover:bg-white/5 border border-white/5 text-white/90",
};

export function Button({ className = "", variant = "default", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
