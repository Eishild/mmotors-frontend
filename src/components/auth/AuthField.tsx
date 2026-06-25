import { forwardRef, type InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Message d'erreur affiché sous le champ (issu de RHF/Zod). */
  error?: string;
}

/**
 * Champ de formulaire labellisé + message d'erreur, compatible RHF.
 * `forwardRef` permet à `{...register(name)}` de brancher sa `ref`.
 */
const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, id, name, ...props }, ref) => {
    const inputId = id ?? name;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <input
          id={inputId}
          name={name}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground/40 aria-[invalid=true]:border-red-500"
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);

AuthField.displayName = "AuthField";

export default AuthField;
