import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";

type AmountInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
};

const amountFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

export function AmountInput({ value, onValueChange, ...props }: AmountInputProps) {
  const displayValue = value > 0 ? amountFormatter.format(value) : "";

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        onValueChange(digits ? Number(digits) : 0);
      }}
    />
  );
}
