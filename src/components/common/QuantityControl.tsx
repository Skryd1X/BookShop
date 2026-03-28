interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
}

export function QuantityControl({ value, onChange }: QuantityControlProps) {
  return (
    <div className="flex items-center rounded-2xl border border-violet-100 bg-white p-1 shadow-sm">
      <button className="quantity-button" onClick={() => onChange(Math.max(1, value - 1))}>−</button>
      <span className="min-w-10 text-center text-sm font-semibold text-slate-900">{value}</span>
      <button className="quantity-button" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
