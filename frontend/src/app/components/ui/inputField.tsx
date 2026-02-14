import * as React from "react";
import { Input } from "./input";

type InputFieldProps = React.ComponentProps<typeof Input> & {
  label?: string;
  helperText?: string;
  error?: string;
};

function InputField({
  label,
  helperText,
  error,
  id,
  ...props
}: InputFieldProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      )}

      <Input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={helperText || error ? messageId : undefined}
        {...props}
      />

      {error ? (
        <p id={messageId} className="text-sm text-destructive">
          {error}
        </p>
      ) : helperText ? (
        <p id={messageId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export { InputField };
