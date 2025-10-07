export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-primary text-white hover:opacity-90 focus:ring-primary",
    secondary: "bg-secondary text-foreground hover:bg-secondary/80 focus:ring-secondary",
    ghost: "bg-transparent hover:bg-muted border border-border",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}


