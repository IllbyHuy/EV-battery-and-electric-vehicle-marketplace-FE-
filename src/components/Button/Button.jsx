export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary:
      "bg-gradient-to-r from-[#7c5cff] to-[#4f46e5] text-white shadow-lg hover:brightness-95",
    secondary:
      "bg-white/6 text-white/90 border border-white/6 hover:bg-white/8",
    ghost:
      "bg-transparent hover:bg-white/5 border border-white/5 text-white/90",
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
