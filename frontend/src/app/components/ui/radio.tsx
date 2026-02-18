import { cn } from "./utils";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-3 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
