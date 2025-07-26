export const COLORS = {
  primary: "#6475e9",
  primaryHover: "#5a6bd8",
  secondary: "#a2acf2",
  background: "#f5f7fb",
  cardBackground: "#ffffff",
  border: "#eaecf0",
  textPrimary: "#1e1e1e",
  textSecondary: "#64707d",
  success: "#dbfce7",
  info: "#dbeafe",
  warning: "#fef3c7",
  purple: "#f3e8ff",
  gray: "#d0d5dd",
  darkGray: "#9e9e9e",
} as const

export const STAT_COLORS = {
  analysis: COLORS.info,
  completed: COLORS.success,
  processing: COLORS.info,
  balance: COLORS.purple,
} as const
