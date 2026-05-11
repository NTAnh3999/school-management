import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[0_2px_0_hsl(var(--primary-press))] hover:-translate-y-px hover:bg-primary-container hover:shadow-[0_4px_0_hsl(var(--primary-press))] active:translate-y-0 active:shadow-[0_2px_0_hsl(var(--primary-press))]",
        secondary:
          "border-secondary/20 bg-secondary text-secondary-foreground shadow-[0_2px_0_rgba(0,82,69,0.22)] hover:-translate-y-px hover:bg-secondary/90",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground shadow-[0_2px_0_rgba(147,0,10,0.18)] hover:-translate-y-px hover:bg-destructive/90",
        outline:
          "border-[1.5px] border-outline-variant bg-white/80 text-foreground shadow-[0_1px_0_rgba(255,255,255,0.8)] hover:border-primary/25 hover:bg-primary/5 hover:text-primary",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-white/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-[13px]",
        lg: "h-12 rounded-xl px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
