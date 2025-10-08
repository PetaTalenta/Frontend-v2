# Flagged Questions Popup Feature

## Overview
Added an interactive popup modal that displays all flagged questions across all assessment phases when users click on the "🏷️ Flagged Questions" section in the sidebar.

## Date
October 9, 2025

## Changes Made

### 1. Added State Management
- **New State**: `showFlaggedPopup` - Controls the visibility of the popup modal

### 2. New Helper Functions

#### `getFlaggedQuestionsDetails()`
Returns detailed information about all flagged questions including:
- Question ID
- Assessment index (Phase 1/2/3)
- Assessment name (Big Five, RIASEC, VIA)
- Section index and name
- Question number within section
- Question text
- Answer status (answered/not answered)

#### `handleFlaggedQuestionClick(questionDetail)`
Handles navigation when a flagged question is clicked in the popup:
- Navigates to the correct assessment phase
- Navigates to the correct section
- Closes the popup
- Scrolls to the specific question

### 3. Updated UI Components

#### Flagged Questions Section (Sidebar)
- Made the entire section **clickable**
- Added hover effect (`hover:bg-amber-100`)
- Added visual cue: "👆 Click to view details"
- Clicking opens the popup modal

#### Popup Modal Features
- **Full-screen overlay** with semi-transparent background (z-index: 60)
- **Centered modal** with max-width 2xl
- **Scrollable content** with max-height 80vh
- **Header section**:
  - 🏷️ icon and title
  - Question count
  - Close button (X)
- **Content section**:
  - List of all flagged questions
  - Each question card shows:
    - Question number badge (colored based on answer status)
    - Phase badge (Phase 1/2/3)
    - Section name
    - Question text (truncated to 2 lines)
    - Answer status badge (✓ Answered / ○ Not Answered)
    - "Click to navigate →" hint
  - Hover effects on question cards
  - Click to navigate to specific question
- **Footer section**:
  - Close button

### 4. Visual Design

#### Colors & Styling
- **Amber theme** for flagged questions consistency
- **Green indicators** for answered questions
- **Red indicators** for unanswered questions
- **Gray theme** for neutral elements
- Smooth transitions and hover effects
- Responsive design with proper spacing

#### Interactions
- Click outside modal to close
- Click close button (X) to close
- Click any question card to navigate
- Smooth scrolling to questions after navigation
- Visual feedback on hover

## User Experience Flow

1. **User flags questions** during assessment (using existing flag feature)
2. **Sidebar shows** "🏷️ Flagged Questions" section with count
3. **User clicks** on the flagged questions section
4. **Popup appears** showing all flagged questions with details
5. **User can review** which questions are flagged and their status
6. **User clicks** on any question card
7. **System navigates** to the correct phase and section
8. **Page scrolls** to the specific question
9. **User can review/edit** the flagged question

## Benefits

1. **Quick Overview**: See all flagged questions in one place
2. **Easy Navigation**: Direct click-to-navigate to any flagged question
3. **Status Visibility**: Immediately see which flagged questions are answered/unanswered
4. **Cross-Phase**: View flagged questions from all 3 assessment phases
5. **Better Organization**: Helps users manage questions they want to review
6. **Improved UX**: No need to manually search through sections

## Technical Details

### Components Involved
- `AssessmentSidebar.tsx` - Main component with all changes

### State Management
- Uses existing `getFlaggedQuestions()` from AssessmentContext
- Local state for popup visibility
- Existing navigation state (currentAssessmentIndex, currentSectionIndex)

### Dependencies
- React hooks (useState, useEffect)
- Next.js router (useRouter)
- AssessmentContext
- Sonner for toasts (existing)
- Lucide icons (existing)

### Browser Compatibility
- Works on all modern browsers
- Responsive design for mobile and desktop
- Proper z-index layering (popup: 60, sidebar: 50, overlay: 40)

## Testing Recommendations

1. **Flag multiple questions** across different phases
2. **Click flagged questions section** - popup should appear
3. **Click outside popup** - should close
4. **Click X button** - should close
5. **Click on a question card** - should navigate and scroll
6. **Test with answered questions** - green badge
7. **Test with unanswered questions** - red badge
8. **Test with no flagged questions** - section should not appear
9. **Test mobile responsiveness** - popup should be scrollable
10. **Test with many flagged questions** - scrolling should work

## Future Enhancements (Optional)

1. Add filter by phase (Phase 1/2/3)
2. Add filter by status (answered/unanswered)
3. Add search functionality
4. Add "unflag all" button
5. Add keyboard shortcuts (Esc to close)
6. Add animation transitions
7. Export flagged questions list
8. Add notes/comments to flagged questions
