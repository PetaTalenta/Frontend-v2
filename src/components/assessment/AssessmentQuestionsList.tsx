'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scaleConfigurations, assessmentTypes, AssessmentType, Question } from '../../data/assessmentQuestions';
import AssessmentQuestionCard from './AssessmentQuestionCard';
import { useAssessment } from '../../contexts/AssessmentContext';
import { useAuth } from '../../contexts/AuthContext';

import { validateSectionCompletion, canNavigateToSection } from '../../utils/assessment-calculations';
import { toast } from 'sonner';

// Import the helper function for ordered categories
import { getOrderedCategories } from '../../utils/assessment-calculations';

export default function AssessmentQuestionsList() {
  const {
    getCurrentAssessment,
    getCurrentSection,
    currentSectionIndex,
    currentAssessmentIndex,
    setCurrentSectionIndex,
    setCurrentAssessmentIndex,
    answers,
    setAnswer
  } = useAssessment();


  const currentAssessment: AssessmentType = getCurrentAssessment();
  if (!currentAssessment || !currentAssessment.scaleType || !currentAssessment.questions) {
    return <div className="text-red-500">Data assessment tidak valid. Silakan refresh halaman atau hubungi admin.</div>;
  }
  const scaleConfig = scaleConfigurations[currentAssessment.scaleType as keyof typeof scaleConfigurations];
  if (!scaleConfig) {
    return <div className="text-red-500">Konfigurasi skala assessment tidak ditemukan.</div>;
  }
  // Group questions by category
  const grouped: Record<string, Question[]> = currentAssessment.questions.reduce((acc: Record<string, Question[]>, q: Question) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  // Use ordered categories instead of Object.keys to ensure consistency
  const categories: string[] = getOrderedCategories(currentAssessment.id, currentAssessment.questions);
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return <div className="text-red-500">Kategori assessment tidak ditemukan.</div>;
  }

  // Handler to update answer for a question
  const handleAnswer = (questionId: number, value: number) => {
    setAnswer(questionId, value);
  };

  // Paging controls
  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handlePrevPhase = () => {
    if (currentAssessmentIndex > 0) {
      setCurrentAssessmentIndex(currentAssessmentIndex - 1);
      // Set to the last section of the previous phase
      const prevAssessment = assessmentTypes[currentAssessmentIndex - 1];
      const prevCategories = Object.keys(prevAssessment.questions.reduce((acc: any, q: any) => {
        acc[q.category] = acc[q.category] || [];
        acc[q.category].push(q);
        return acc;
      }, {}));
      setCurrentSectionIndex(prevCategories.length - 1);
    }
  };

  const handleNextSection = () => {
    // Check if current section is complete before allowing forward navigation
    const currentSectionValidation = validateSectionCompletion(
      answers,
      currentAssessmentIndex,
      currentSectionIndex
    );

    if (!currentSectionValidation.isComplete) {
      const missingCount = currentSectionValidation.totalQuestions - currentSectionValidation.answeredQuestions;
      toast.warning('Section Belum Selesai', {
        description: `Mohon selesaikan ${missingCount} soal yang tersisa di section ini sebelum melanjutkan ke section berikutnya.`,
        duration: 4000,
      });
      return;
    }

    if (currentSectionIndex < categories.length - 1) {
      // Navigate to next section within current assessment
      setCurrentSectionIndex(currentSectionIndex + 1);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Last section of current assessment - check if we can go to next phase
      if (currentAssessmentIndex < assessmentTypes.length - 1) { // Not on the last phase
        // Move to next phase
        setCurrentAssessmentIndex(currentAssessmentIndex + 1);
        setCurrentSectionIndex(0); // Reset to first section of new phase
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success('Pindah ke Phase Selanjutnya', {
          description: `Anda telah menyelesaikan ${currentAssessment.name}. Melanjutkan ke phase berikutnya.`,
          duration: 3000,
        });
      }
    }
  };

  const { user } = useAuth();



  // Current section data
  const category = categories[currentSectionIndex];
  const questions = grouped[category];
  const answered = questions.filter((q: any) => answers[q.id] != null).length;
  const total = questions.length;
  const percent = Math.round((answered / total) * 100);

  // Check if we're on the final phase and final section
  const isLastPhase = currentAssessmentIndex === assessmentTypes.length - 1; // Last phase check
  const isLastSection = currentSectionIndex === categories.length - 1;
  const isPhaseTransition = isLastSection && !isLastPhase; // Last section of non-final phase

  // Check if we're at the beginning of Phase 2 or Phase 3
  const isPhaseBeginning = currentSectionIndex === 0 && currentAssessmentIndex > 0;





  return (
    <div className="flex flex-col items-center w-full px-4 lg:px-0">
      <div className="w-full mb-8 lg:mb-12">
        {/* Section Header - responsive width */}
        <div className="w-full max-w-[1400px] mx-auto mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="inline-block px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-[#e7eaff] text-[#6475e9] text-xs sm:text-sm font-semibold">
                {currentAssessment.name}
              </span>
              <h2 className="font-bold text-lg sm:text-xl lg:text-2xl text-[#313131]">{category}</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
              <span className="text-xs sm:text-sm text-[#64707d] whitespace-nowrap">Progress:</span>
              <span className="font-semibold text-sm sm:text-base lg:text-lg text-[#6475e9] whitespace-nowrap">{answered}/{total}</span>
              <div className="flex-1 sm:flex-none w-full sm:w-16 lg:w-24 h-2 bg-[#eaecf0] rounded-full ml-1 sm:ml-2">
                <div
                  className="h-2 bg-[#6475e9] rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Progress bar removed, use sidebar only */}
        <div className="flex flex-col ">
          {questions.map((question: Question, idx: number) => {
            const isLast = idx === questions.length - 1;
            return (
              <div key={question.id} data-question-id={question.id}>
                <AssessmentQuestionCard
                  question={question}
                  scaleConfig={scaleConfig}
                  scaleLabels={currentAssessment.scaleLabels}
                  selectedAnswer={answers[question.id] ?? null}
                  onAnswer={value => handleAnswer(question.id, value)}
                  isLastQuestion={isLast}
                  navigationButtons={isLast ? (
                    <div className={`flex flex-col sm:flex-row items-center mt-2 px-2 gap-3 sm:gap-0 ${
                      currentAssessmentIndex === 0 && currentSectionIndex === 0
                        ? 'sm:justify-end'
                        : 'sm:justify-between'
                    }`}>
                      {/* Hide Previous button at the very beginning (Phase 1, Openness to Experience) */}
                      {!(currentAssessmentIndex === 0 && currentSectionIndex === 0) && (
                        <button
                          onClick={isPhaseBeginning ? handlePrevPhase : handlePrevSection}
                          className="px-4 sm:px-6 py-2 rounded-lg border font-medium flex items-center gap-2 border-[#6475e9] text-[#6475e9] bg-white hover:bg-[#f2f4ff] w-full sm:w-auto justify-center sm:justify-start"
                        >
                          <span className="text-lg">&larr;</span>
                          <span className="text-sm sm:text-base">{isPhaseBeginning ? 'Phase Sebelumnya' : 'Sebelumnya'}</span>
                        </button>
                      )}
                      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
                        {/* "Lewati" button removed from last question card */}
                        {/* "Akhiri Test" button removed - only show navigation buttons */}
                        {!(isLastPhase && isLastSection) && (
                          <button
                            onClick={handleNextSection}
                            className="px-4 sm:px-6 py-2 rounded-lg border font-semibold flex items-center gap-2 w-full sm:w-auto justify-center text-sm sm:text-base border-[#6475e9] text-white bg-[#6475e9] hover:bg-[#5a6fd8]"
                          >
                            <span>
                              {isPhaseTransition
                                ? 'Phase Selanjutnya'
                                : 'Selanjutnya'
                              }
                            </span>
                            <span className="ml-1 text-lg">&rarr;</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
