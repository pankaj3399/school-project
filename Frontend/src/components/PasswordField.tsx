import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_REQUIREMENTS } from "@/lib/password";

type PasswordFieldProps = {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showRequirements?: boolean;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  showRequirements = false,
  placeholder = "••••••••",
  autoComplete,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-600 ml-1">{label}</Label>
      {showRequirements && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-700 mb-1">Password must contain:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {PASSWORD_REQUIREMENTS.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="relative">
        <Input
          id={id}
          name={name ?? id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={`rounded-xl py-6 pr-12 focus:ring-[#00a58c] ${hasError ? "border-red-500" : "border-gray-200"}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hasError && (
        <p id={errorId} className="text-xs text-red-500 mt-1 ml-1">{error}</p>
      )}
    </div>
  );
}
