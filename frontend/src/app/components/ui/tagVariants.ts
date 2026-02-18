import { cva } from "class-variance-authority";

export const tagVariants = cva(
  "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
        green: "bg-green-50 text-green-700 hover:bg-green-100",
        purple: "bg-purple-50 text-purple-700 hover:bg-purple-100",
        orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
