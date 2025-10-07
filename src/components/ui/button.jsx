import { cn } from "../../utils/cn";

const variants = {
  default: "bg-primary text-white shadow hover:opacity-90",
  secondary: "bg-secondary text-foreground hover:bg-secondary/80",
  ghost: "bg-transparent hover:bg-muted border border-border",
};

export function Button({ className = "", variant = "default", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}


