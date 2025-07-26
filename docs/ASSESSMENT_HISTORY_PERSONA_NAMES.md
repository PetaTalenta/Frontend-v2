# Assessment History - Persona Profile Names

## Overview
Perubahan ini memastikan bahwa nama pada tabel history assessment berasal dari nama profil kepribadian hasil assessment, bukan dari nama hardcoded.

## Changes Made

### 1. Modified `services/assessment-api.ts`
- Updated `submitAssessment` function to return `personaTitle` along with `resultId`
- This allows components to access the generated persona profile title immediately after assessment completion

```typescript
return {
  resultId,
  status: 'processing',
  personaTitle: aiAnalysis.title
};
```

### 2. Updated Assessment Components

#### `components/assessment/AssessmentQuestionsList.tsx`
- Modified to use `personaTitle` from `submitAssessment` response
- Fallback to "Assessment Lengkap" if `personaTitle` is not available

#### `components/assessment/AssessmentHeader.tsx`
- Modified to use `personaTitle` from `submitAssessment` response
- Fallback to "Assessment Lengkap" if `personaTitle` is not available
- Assessment yang belum selesai tetap menggunakan "Assessment Belum Selesai"

### 3. Enhanced `services/user-stats.ts`
- Updated `formatAssessmentHistory` function to update localStorage history items with persona profile titles
- This ensures that existing assessment history items get updated with proper persona names

```typescript
// Update local history items with persona profile titles if available
const updatedLocalHistory = localHistory.map((item: any) => {
  if (item.resultId && item.status === "Selesai") {
    // Try to get the assessment result to extract persona profile title
    const assessmentResult = JSON.parse(localStorage.getItem(`assessment-result-${item.resultId}`) || '{}');
    if (assessmentResult.persona_profile?.title) {
      return {
        ...item,
        nama: assessmentResult.persona_profile.title
      };
    }
  }
  return item;
});
```

## How It Works

1. **Assessment Completion**: When user completes an assessment, `submitAssessment` generates AI analysis and returns the persona profile title
2. **History Storage**: Assessment components use the persona title when creating history items in localStorage
3. **History Display**: The assessment table displays the persona profile names instead of generic names
4. **Backward Compatibility**: Existing history items are updated with persona names when available

## Benefits

- **Meaningful Names**: Assessment history shows descriptive persona names like "The Creative Investigator" instead of generic "Assessment Lengkap"
- **Better User Experience**: Users can easily identify different assessments by their persona profiles
- **Consistent Data**: All assessment history items use the same naming convention
- **Backward Compatibility**: Existing data is automatically updated

## Example

Before:
- "Assessment Lengkap"
- "Assessment Belum Selesai"

After:
- "The Creative Investigator"
- "The Dynamic Achiever"
- "The Social Entrepreneur"
- "Assessment Belum Selesai" (for incomplete assessments)
