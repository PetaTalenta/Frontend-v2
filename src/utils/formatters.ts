export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num)
}

export function getTypeColor(type: "PG" | "Essay"): string {
  switch (type) {
    case "PG":
      return "#f3f3f3"
    case "Essay":
      return "#e0f2fe"
    default:
      return "#f3f3f3"
  }
}
