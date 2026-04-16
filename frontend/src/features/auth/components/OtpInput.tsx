import React, { useRef, useState, useEffect } from "react";
import { cn } from "../../../lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  onComplete?: (value: string) => void;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  onComplete,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value.length <= length) {
      const newOtp = value
        .split("")
        .concat(Array(length - value.length).fill(""));
      setOtp(newOtp);
    }
  }, [value, length]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return; // Only allow numbers if needed, but lets allow any single char or numbers

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1); // Only take the last character

    const joined = newOtp.join("");
    onChange(joined);

    // Focus next
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (joined.length === length && joined.indexOf("") === -1) {
      onComplete?.(joined);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Current empty, focus previous
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);

    if (pastedData) {
      const newOtp = pastedData
        .split("")
        .concat(Array(length - pastedData.length).fill(""));
      onChange(pastedData);

      const nextFocus = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextFocus]?.focus();

      if (pastedData.length === length) {
        onComplete?.(pastedData);
      }
    }
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-xl font-semibold rounded-md border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
            error && "border-destructive focus:ring-destructive",
            disabled && "opacity-50 cursor-not-allowed bg-raised",
          )}
        />
      ))}
    </div>
  );
}
