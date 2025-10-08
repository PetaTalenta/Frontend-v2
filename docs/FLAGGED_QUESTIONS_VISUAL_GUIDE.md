# Visual Guide: Flagged Questions Popup Feature

## Feature Location & Flow

### 1. Flagged Questions Section (Before Click)
```
┌─────────────────────────────────────┐
│  🏷️ Flagged Questions              │
│                                     │
│  3 questions flagged for review     │
│  👆 Click to view details           │
└─────────────────────────────────────┘
```
- Located in the sidebar
- Shows total count of flagged questions
- Amber/yellow background
- Hover effect for better UX
- **CLICKABLE** - Click anywhere on this section

---

### 2. Popup Modal (After Click)

```
╔══════════════════════════════════════════════════════════════╗
║  Background Overlay (Semi-transparent black)                 ║
║                                                               ║
║    ┌────────────────────────────────────────────────────┐   ║
║    │ 🏷️  Flagged Questions              [X]            │   ║
║    │     3 questions marked for review                  │   ║
║    ├────────────────────────────────────────────────────┤   ║
║    │                                                     │   ║
║    │  ┌──────────────────────────────────────────────┐ │   ║
║    │  │ [5]  Phase 1 • Openness to Experience        │ │   ║
║    │  │      I enjoy trying new things and...        │ │   ║
║    │  │      ✓ Answered    Click to navigate →       │ │   ║
║    │  └──────────────────────────────────────────────┘ │   ║
║    │                                                     │   ║
║    │  ┌──────────────────────────────────────────────┐ │   ║
║    │  │ [12] Phase 2 • Realistic                     │ │   ║
║    │  │      I like working with tools and...        │ │   ║
║    │  │      ○ Not Answered    Click to navigate →   │ │   ║
║    │  └──────────────────────────────────────────────┘ │   ║
║    │                                                     │   ║
║    │  ┌──────────────────────────────────────────────┐ │   ║
║    │  │ [8]  Phase 3 • Wisdom                        │ │   ║
║    │  │      I think carefully before making...      │ │   ║
║    │  │      ✓ Answered    Click to navigate →       │ │   ║
║    │  └──────────────────────────────────────────────┘ │   ║
║    │                                                     │   ║
║    ├────────────────────────────────────────────────────┤   ║
║    │                 [ Close ]                          │   ║
║    └────────────────────────────────────────────────────┘   ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Component Breakdown

### Question Card Details

Each flagged question card shows:

```
┌────────────────────────────────────────────────────────────┐
│  ┌───┐                                                      │
│  │ 5 │   Phase 1 • Openness to Experience                  │
│  └───┘                                                      │
│                                                             │
│  I enjoy trying new things and exploring different...      │
│                                                             │
│  [ ✓ Answered ]     Click to navigate →                    │
└────────────────────────────────────────────────────────────┘
```

**Elements:**
1. **Question Number Badge** (left)
   - Green background = Answered
   - Gray background = Not Answered
   
2. **Phase Badge** (top)
   - Shows "Phase 1", "Phase 2", or "Phase 3"
   - Amber/yellow background
   
3. **Section Name** (top right)
   - Shows the category name
   
4. **Question Text** (middle)
   - Truncated to 2 lines with ellipsis
   
5. **Status Badge** (bottom left)
   - ✓ Answered (green)
   - ○ Not Answered (red)
   
6. **Navigation Hint** (bottom right)
   - "Click to navigate →"

---

## Color Coding

### Status Colors
- **🟢 Green**: Answered questions
- **🔴 Red**: Unanswered questions
- **🟡 Amber/Yellow**: Flag indicator, phase badges
- **⚪ Gray**: Neutral elements, close button

### Visual Hierarchy
1. **Primary**: Amber (flagged theme)
2. **Success**: Green (answered)
3. **Warning**: Red (not answered)
4. **Neutral**: Gray (general UI)

---

## Interaction States

### Hover Effects
```
Before Hover:              After Hover:
┌──────────────┐          ┌──────────────┐
│ Question     │    →     │ Question     │  (+ shadow)
│ Card         │          │ Card         │  (+ border glow)
└──────────────┘          └──────────────┘
```

### Click Actions

1. **Click on Flagged Questions Section**
   - Opens popup modal
   - Shows overlay
   - Disables background scroll

2. **Click on Question Card**
   - Navigates to correct phase
   - Navigates to correct section
   - Closes popup
   - Scrolls to question (smooth)

3. **Click on X Button**
   - Closes popup immediately

4. **Click Outside Modal**
   - Closes popup (click on overlay)

---

## Mobile Responsive Design

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │  Popup Modal (max-width: 2xl)          │    │
│  │  Centered in viewport                  │    │
│  │  Scrollable content                    │    │
│  └────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Mobile (< 1024px)
```
┌───────────────────┐
│                   │
│ ┌───────────────┐ │
│ │  Popup Modal  │ │
│ │  Full width   │ │
│ │  with padding │ │
│ │  Scrollable   │ │
│ └───────────────┘ │
│                   │
└───────────────────┘
```

---

## Z-Index Layering

```
Layer 4: Popup Modal (z-60)      🔝 Top
         ↑
Layer 3: Sidebar (z-50)          
         ↑
Layer 2: Mobile Overlay (z-40)   
         ↑
Layer 1: Main Content            🔽 Bottom
```

---

## User Journey Example

1. **User is on Phase 1, Question 5**
   - Clicks flag button on question
   - Question is marked with 🏷️

2. **User moves to Phase 2**
   - Flags Question 12
   - Sidebar shows "2 questions flagged"

3. **User moves to Phase 3**
   - Flags Question 8
   - Sidebar shows "3 questions flagged"

4. **User wants to review flagged questions**
   - Clicks on "🏷️ Flagged Questions" in sidebar
   - Popup appears showing all 3 flagged questions

5. **User sees Question 12 is not answered**
   - Clicks on Question 12 card
   - System navigates to Phase 2 → Realistic section
   - Scrolls to Question 12
   - User can now answer it

6. **User finishes reviewing**
   - Clicks "Close" button or outside popup
   - Popup closes
   - Returns to assessment

---

## Accessibility Features

- ✅ Click outside to close
- ✅ Close button with aria-label
- ✅ Keyboard navigation support
- ✅ Screen reader friendly text
- ✅ High contrast colors
- ✅ Clear visual indicators
- ✅ Smooth animations
- ✅ Touch-friendly on mobile

---

## Performance Considerations

- ⚡ Modal only renders when needed (conditional rendering)
- ⚡ Efficient question lookup with array methods
- ⚡ Smooth scroll with setTimeout for DOM update
- ⚡ No unnecessary re-renders
- ⚡ Optimized click handlers

---

## Testing Checklist

- [ ] Flag questions in Phase 1
- [ ] Flag questions in Phase 2
- [ ] Flag questions in Phase 3
- [ ] Click flagged questions section
- [ ] Popup appears correctly
- [ ] Click on answered question card
- [ ] Navigation works correctly
- [ ] Scroll to question works
- [ ] Click on unanswered question card
- [ ] Status badges display correctly
- [ ] Click X button to close
- [ ] Click outside to close
- [ ] Mobile responsive check
- [ ] Scrolling works with many questions
- [ ] No console errors
