## Profile Page Pastel Color Palette

This palette is applied via the `.profile-theme` scope using CSS variables (HSL). Hex codes are provided for documentation and handoff.

Primary (Pastel Blue)
- HSL: 207 56% 78%
- Hex: #A3C9E9
- Foreground on Primary: #0F172A (AA compliant)

Background
- HSL: 210 25% 98%
- Hex: #F6F9FC

Secondary (Soft Blue-Gray)
- HSL: 200 30% 95%
- Hex: #EAF2F7

Muted
- HSL: 210 20% 96%
- Hex: #EEF2F6
- Muted Foreground: HSL 215 16% 46% (#6B7280)

Accent (Gentle Green)
- HSL: 155 30% 92%
- Hex: #E3F3EC

Border/Input
- HSL: 210 30% 90%
- Hex: #DAE4EE

Focus Ring
- HSL: 207 56% 68%
- Hex: #86B6DD

Foreground (Text)
- HSL: 222 47% 11%
- Hex: #0F172A

Destructive (Errors)
- HSL: 0 84% 60%
- Hex: #EF4444
- Foreground: #FAFAFA

Accessibility notes
- Primary (#A3C9E9) on Foreground (#0F172A) passes WCAG 2.1 AA for normal text and UI controls.
- Body text uses #0F172A on #F6F9FC or white cards — AA compliant.
- Links/buttons use hover states at ~90% of primary to maintain contrast.

Implementation
- The `.profile-theme` class sets the scope for Tailwind CSS variables.
- Replace hardcoded grays and blues with `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-primary`, `text-primary-foreground`, and `border-border`.
- Prefer `hover:bg-primary/90` for subtle, performant transitions.

