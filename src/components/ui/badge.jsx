import { cn } from "../../utils/cn";

export function Badge({ className = "", ...props }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs", className)} {...props} />;
}


