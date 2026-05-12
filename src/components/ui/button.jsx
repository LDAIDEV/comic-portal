import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-violet-300 text-slate-950 hover:bg-violet-200",
  secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
  destructive: "bg-red-500 text-white hover:bg-red-400",
  outline: "border border-white/10 bg-transparent text-slate-100 hover:bg-white/10",
  ghost: "bg-transparent text-slate-100 hover:bg-white/10",
  link: "bg-transparent text-violet-200 underline-offset-4 hover:underline",
};

function Button({ className, variant = "default", type = "button", ...props }) {
  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    />
  );
}

export { Button };
