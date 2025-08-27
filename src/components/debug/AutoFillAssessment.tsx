'use client';

import React from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export default function AutoFillAssessment() {
  const { setAnswer, answers } = useAssessment();

  const fillAllAssessments = () => {
    // Fill all Big Five questions (IDs 1-44)
    for (let i = 1; i <= 44; i++) {
      setAnswer(i, Math.floor(Math.random() * 5) + 1);
    }
    
    // Fill all RIASEC questions (IDs 101-160)
    for (let i = 101; i <= 160; i++) {
      setAnswer(i, Math.floor(Math.random() * 5) + 1);
    }
    
    // Fill all VIA questions (IDs 201-296)
    for (let i = 201; i <= 296; i++) {
      setAnswer(i, Math.floor(Math.random() * 5) + 1);
    }
  };

  const fillBigFiveOnly = () => {
    // Fill all Big Five questions (IDs 1-44)
    for (let i = 1; i <= 44; i++) {
      setAnswer(i, Math.floor(Math.random() * 5) + 1);
    }
  };

  const fillRiasecOnly = () => {
    // Fill all RIASEC questions (IDs 101-160)
    for (let i = 101; i <= 160; i++) {
      setAnswer(i, Math.floor(Math.random() * 5) + 1);
    }
  };

  const fillViaOnly = () => {
    // Fill all VIA questions (IDs 201-296)
    for (let i = 201; i <= 296; i++) {
      setAnswer(i, Math.floor(Math.random() * 5) + 1);
    }
  };

  const clearAllAnswers = () => {
    // Clear all answers
    for (let i = 1; i <= 44; i++) {
      setAnswer(i, null);
    }
    for (let i = 101; i <= 160; i++) {
      setAnswer(i, null);
    }
    for (let i = 201; i <= 296; i++) {
      setAnswer(i, null);
    }
  };

  // Count answered questions
  const bigFiveAnswered = Object.keys(answers).filter(id => {
    const num = parseInt(id);
    return num >= 1 && num <= 44 && answers[num] !== null;
  }).length;

  const riasecAnswered = Object.keys(answers).filter(id => {
    const num = parseInt(id);
    return num >= 101 && num <= 160 && answers[num] !== null;
  }).length;

  const viaAnswered = Object.keys(answers).filter(id => {
    const num = parseInt(id);
    return num >= 201 && num <= 296 && answers[num] !== null;
  }).length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Auto Fill Assessment (Debug Tool)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Current Progress</h3>
          <div className="space-y-2 text-sm">
            <p>Big Five: {bigFiveAnswered}/44 answered</p>
            <p>RIASEC: {riasecAnswered}/60 answered</p>
            <p>VIA: {viaAnswered}/96 answered</p>
            <p className="font-medium">Total: {bigFiveAnswered + riasecAnswered + viaAnswered}/200 answered</p>
          </div>
        </div>

        {/* Fill Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={fillBigFiveOnly}
              variant="outline"
              className="w-full"
            >
              Fill Big Five Only
            </Button>
            <Button 
              onClick={fillRiasecOnly}
              variant="outline"
              className="w-full"
            >
              Fill RIASEC Only
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={fillViaOnly}
              variant="outline"
              className="w-full"
            >
              Fill VIA Only
            </Button>
            <Button 
              onClick={fillAllAssessments}
              className="w-full"
            >
              Fill All Assessments
            </Button>
          </div>
          
          <Button 
            onClick={clearAllAnswers}
            variant="destructive"
            className="w-full"
          >
            Clear All Answers
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-800">Instructions</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. Use "Fill Big Five Only" to test Phase 1 → Phase 2 navigation</p>
            <p>2. Use "Fill RIASEC Only" to test Phase 2 → Phase 3 navigation</p>
            <p>3. Use "Fill All Assessments" to test complete flow</p>
            <p>4. Check sidebar navigation after filling to verify the fix</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
