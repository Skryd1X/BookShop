export function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} сум`;
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const url = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.set(key, String(value));
    }
  });
  const query = url.toString();
  return query ? `?${query}` : "";
}

export function firstLetter(name: string) {
  return (name || "?").trim().slice(0, 1).toUpperCase();
}
