'use client';

import { useState } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import { assessmentTypes } from '../../data/assessmentQuestions';

export default function AssessmentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    currentAssessmentIndex,
    currentSectionIndex,
    setCurrentAssessmentIndex,
    setCurrentSectionIndex,
    answers,
    getProgress
  } = useAssessment();

  const progress = getProgress();

  // Get current assessment categories and their question counts
  const currentAssessment = assessmentTypes[currentAssessmentIndex];
  const currentGrouped = currentAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const currentCategories = Object.keys(currentGrouped);

  // Get Big Five categories for Phase 1 display
  const bigFiveAssessment = assessmentTypes[0];
  const bigFiveGrouped = bigFiveAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const bigFiveCategories = Object.keys(bigFiveGrouped);

  // Get RIASEC categories for Phase 2 display
  const riasecAssessment = assessmentTypes[1];
  const riasecGrouped = riasecAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const riasecCategories = Object.keys(riasecGrouped);

  // Get VIA categories for Phase 3 display
  const viaAssessment = assessmentTypes[2];
  const viaGrouped = viaAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const viaCategories = Object.keys(viaGrouped);

  const handlePhaseClick = (assessmentIndex: number) => {
    setCurrentAssessmentIndex(assessmentIndex);
    setCurrentSectionIndex(0); // Reset to first section of new assessment
  };

  const handleSectionClick = (assessmentIndex: number, sectionIndex: number) => {
    setCurrentAssessmentIndex(assessmentIndex);
    setCurrentSectionIndex(sectionIndex);
  };

  const getSectionProgress = (assessmentIndex: number, sectionIndex?: number) => {
    const assessment = assessmentTypes[assessmentIndex];
    if (sectionIndex !== undefined) {
      if (assessmentIndex === 0) {
        // Big Five - calculate section progress
        const category = bigFiveCategories[sectionIndex];
        const questionsInSection = bigFiveGrouped[category] || [];
        const answeredInSection = questionsInSection.filter((q: any) => answers[q.id] != null).length;
        return { answered: answeredInSection, total: questionsInSection.length };
      } else if (assessmentIndex === 1) {
        // RIASEC - calculate section progress
        const category = riasecCategories[sectionIndex];
        const questionsInSection = riasecGrouped[category] || [];
        const answeredInSection = questionsInSection.filter((q: any) => answers[q.id] != null).length;
        return { answered: answeredInSection, total: questionsInSection.length };
      } else if (assessmentIndex === 2) {
        // VIA Character Strengths - calculate section progress
        const category = viaCategories[sectionIndex];
        const questionsInSection = viaGrouped[category] || [];
        const answeredInSection = questionsInSection.filter((q: any) => answers[q.id] != null).length;
        return { answered: answeredInSection, total: questionsInSection.length };
      }
    } else {
      // Overall assessment progress
      const questionsInAssessment = assessment.questions;
      const answeredInAssessment = questionsInAssessment.filter((q: any) => answers[q.id] != null).length;
      return { answered: answeredInAssessment, total: questionsInAssessment.length };
    }
    return { answered: 0, total: 0 };
  };

  return (
    <aside className="w-full lg:w-[280px] lg:h-screen bg-white border-b lg:border-b-0 lg:border-r border-[#eaecf0] p-4 lg:p-6 flex flex-col gap-4 overflow-y-auto">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Assessment Progress</h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Toggle progress details"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Desktop Title */}
      <h2 className="hidden lg:block font-bold text-xl mb-4 text-center">Assessment Progress</h2>

      {/* Collapsible Content */}
      <div className={`flex flex-col gap-4 ${isCollapsed ? 'hidden lg:flex' : 'flex'}`}>

      {/* Phase 1 - Big Five */}
      <div className={`rounded-xl p-4 mb-2 border cursor-pointer transition-all ${
        currentAssessmentIndex === 0
          ? 'bg-[#f5f7fb] border-[#e7eaff]'
          : 'bg-white border-[#eaecf0] hover:bg-[#f9fafb]'
      }`}
      onClick={() => handlePhaseClick(0)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">Phase 1</span>
          <span className="text-xs text-[#64707d] font-medium">
            {getSectionProgress(0).answered}/{getSectionProgress(0).total}
          </span>
        </div>
        <div className="text-xs text-[#64707d] mb-2">Big Five Personality</div>
        <div className="w-full h-2 bg-[#eaecf0] rounded-full mb-2">
          <div
            className="h-2 bg-[#6475e9] rounded-full transition-all"
            style={{
              width: `${Math.round((getSectionProgress(0).answered / getSectionProgress(0).total) * 100)}%`
            }}
          />
        </div>

        {/* Sub-phases for Big Five */}
        {currentAssessmentIndex === 0 && (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            {bigFiveCategories.map((category, index) => {
              const sectionProgress = getSectionProgress(0, index);
              const isActive = currentAssessmentIndex === 0 && currentSectionIndex === index;
              const categoryNames: Record<string, string> = {
                'Openness to Experience': 'Openness to Experience',
                'Conscientiousness': 'Conscientiousness',
                'Extraversion': 'Extraversion',
                'Agreeableness': 'Agreeableness',
                'Neuroticism': 'Neuroticism'
              };

              return (
                <div
                  key={category}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all w-full ${
                    isActive
                      ? 'bg-[#e7eaff]'
                      : 'hover:bg-[#f0f1f3]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick(0, index);
                  }}
                >
                  <span className={`text-sm ${isActive ? 'text-[#6475e9] font-semibold' : 'text-[#64707d]'}`}>
                    {categoryNames[category] || category}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold border ${
                    isActive
                      ? 'bg-white text-[#6475e9] border-[#e7eaff]'
                      : 'bg-[#f5f7fb] text-[#64707d] border-[#eaecf0]'
                  }`}>
                    {sectionProgress.answered}/{sectionProgress.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Phase 2 - RIASEC */}
      <div className={`rounded-xl p-4 mb-2 border cursor-pointer transition-all ${
        currentAssessmentIndex === 1
          ? 'bg-[#f5f7fb] border-[#e7eaff]'
          : 'bg-white border-[#eaecf0] hover:bg-[#f9fafb]'
      }`}
      onClick={() => handlePhaseClick(1)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">Phase 2</span>
          <span className="text-xs text-[#64707d] font-medium">
            {getSectionProgress(1).answered}/{getSectionProgress(1).total}
          </span>
        </div>
        <div className="text-xs text-[#64707d] mb-2">RIASEC Holland Codes</div>
        <div className="w-full h-2 bg-[#eaecf0] rounded-full mb-2">
          <div
            className="h-2 bg-[#6475e9] rounded-full transition-all"
            style={{
              width: `${Math.round((getSectionProgress(1).answered / getSectionProgress(1).total) * 100)}%`
            }}
          />
        </div>

        {/* Sub-phases for RIASEC */}
        {currentAssessmentIndex === 1 && (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            {riasecCategories.map((category, index) => {
              const sectionProgress = getSectionProgress(1, index);
              const isActive = currentAssessmentIndex === 1 && currentSectionIndex === index;
              const categoryNames: Record<string, string> = {
                'Realistic': 'Realistic',
                'Investigative': 'Investigative',
                'Artistic': 'Artistic',
                'Social': 'Social',
                'Enterprising': 'Enterprising',
                'Conventional': 'Conventional'
              };

              return (
                <div
                  key={category}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all w-full ${
                    isActive
                      ? 'bg-[#e7eaff]'
                      : 'hover:bg-[#f0f1f3]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick(1, index);
                  }}
                >
                  <span className={`text-sm ${isActive ? 'text-[#6475e9] font-semibold' : 'text-[#64707d]'}`}>
                    {categoryNames[category] || category}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold border ${
                    isActive
                      ? 'bg-white text-[#6475e9] border-[#e7eaff]'
                      : 'bg-[#f5f7fb] text-[#64707d] border-[#eaecf0]'
                  }`}>
                    {sectionProgress.answered}/{sectionProgress.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Phase 3 - VIA Character Strengths */}
      <div className={`rounded-xl p-4 mb-2 border cursor-pointer transition-all ${
        currentAssessmentIndex === 2
          ? 'bg-[#f5f7fb] border-[#e7eaff]'
          : 'bg-white border-[#eaecf0] hover:bg-[#f9fafb]'
      }`}
      onClick={() => handlePhaseClick(2)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">Phase 3</span>
          <span className="text-xs text-[#64707d] font-medium">
            {getSectionProgress(2).answered}/{getSectionProgress(2).total}
          </span>
        </div>
        <div className="text-xs text-[#64707d] mb-2">VIA Character Strengths</div>
        <div className="w-full h-2 bg-[#eaecf0] rounded-full mb-2">
          <div
            className="h-2 bg-[#6475e9] rounded-full transition-all"
            style={{
              width: `${Math.round((getSectionProgress(2).answered / getSectionProgress(2).total) * 100)}%`
            }}
          />
        </div>

        {/* Sub-phases for VIA Character Strengths */}
        {currentAssessmentIndex === 2 && (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            {viaCategories.map((category, index) => {
              const sectionProgress = getSectionProgress(2, index);
              const isActive = currentAssessmentIndex === 2 && currentSectionIndex === index;
              const categoryNames: Record<string, string> = {
                'Wisdom': 'Wisdom',
                'Courage': 'Courage',
                'Humanity': 'Humanity',
                'Justice': 'Justice',
                'Temperance': 'Temperance',
                'Transcendence': 'Transcendence'
              };

              return (
                <div
                  key={category}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all w-full ${
                    isActive
                      ? 'bg-[#e7eaff]'
                      : 'hover:bg-[#f0f1f3]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick(2, index);
                  }}
                >
                  <span className={`text-sm ${isActive ? 'text-[#6475e9] font-semibold' : 'text-[#64707d]'}`}>
                    {categoryNames[category] || category}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold border ${
                    isActive
                      ? 'bg-white text-[#6475e9] border-[#e7eaff]'
                      : 'bg-[#f5f7fb] text-[#64707d] border-[#eaecf0]'
                  }`}>
                    {sectionProgress.answered}/{sectionProgress.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Total Progress */}
      <div className="mt-auto pt-4">
        <div className="text-center text-sm font-semibold mb-2">Total Progress</div>
        <div className="w-full h-2 bg-[#eaecf0] rounded-full">
          <div
            className="h-2 bg-[#6475e9] rounded-full transition-all"
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
        <div className="text-center text-xs text-[#64707d] mt-1">{progress.overallProgress}% Complete</div>
      </div>
    </aside>
  );
}
