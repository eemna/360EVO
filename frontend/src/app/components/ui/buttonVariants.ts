import { cva } from "class-variance-authority";


export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent",
        danger: "bg-destructive text-white hover:bg-destructive/90",
        white: "bg-white text-primary hover:bg-gray-100",
        link:"bg-transparent text-muted-foreground hover:text-foreground underline-offset-4 hover:underline",
        gradient:"bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90",
        ghost: "bg-transparent hover:bg-accent text-foreground",

      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);