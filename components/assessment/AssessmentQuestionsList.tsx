'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scaleConfigurations, assessmentTypes } from '../../data/assessmentQuestions';
import AssessmentQuestionCard from './AssessmentQuestionCard';
import { useAssessment } from '../../contexts/AssessmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { submitAssessmentFlexible } from '../../services/assessment-api';
import { useAssessmentSubmission } from '../../hooks/useAssessmentSubmission';
import { validateAnswers } from '../../utils/assessment-calculations';

export default function AssessmentQuestionsList() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const currentAssessment = getCurrentAssessment();
  const scaleConfig = scaleConfigurations[currentAssessment.scaleType];

  // Group questions by category
  const grouped = currentAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  // Handler to update answer for a question
  const handleAnswer = (questionId: number, value: number) => {
    setAnswer(questionId, value);
  };

  // Paging controls
  const handlePrevSection = () => {
    if (currentSectionIndex > 0) setCurrentSectionIndex(currentSectionIndex - 1);
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
    if (currentSectionIndex < categories.length - 1) {
      // Navigate to next section within current assessment
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      // Last section of current assessment - check if we can go to next phase
      if (currentAssessmentIndex < 2) { // Not on the last phase (VIA)
        // Move to next phase
        setCurrentAssessmentIndex(currentAssessmentIndex + 1);
        setCurrentSectionIndex(0); // Reset to first section of new phase
      }
    }
  };

  const { user } = useAuth();

  // Assessment submission hook for loading page
  const { submitAssessment: submitToLoadingPage } = useAssessmentSubmission({
    assessmentName: 'AI-Driven Talent Mapping',
    onSubmissionStart: () => {
      console.log('Redirecting to loading page from Akhiri Test button...');
    },
    onSubmissionError: (error) => {
      console.error('Failed to redirect to loading page:', error);
      setIsSubmitting(false);
    }
  });

  const handleFinishAssessment = async () => {
    if (isSubmitting) return;

    console.log('AssessmentQuestionsList: Starting assessment submission...');
    setIsSubmitting(true);

    try {
      console.log('AssessmentQuestionsList: Submitting assessment with answers:', Object.keys(answers).length, 'questions answered');

      // Use loading page for better user experience
      console.log('AssessmentQuestionsList: Redirecting to loading page...');
      await submitToLoadingPage(answers, 'AI-Driven Talent Mapping');
      return;

      // Original submission code (kept as fallback, but not reached)
      const { resultId, personaTitle } = await submitAssessmentFlexible(answers, user?.id);

      console.log('AssessmentQuestionsList: Assessment submitted successfully!');
      console.log('Result ID:', resultId);
      console.log('Persona Title:', personaTitle);

      // Add assessment to dashboard history with "Selesai" status
      const assessmentHistoryItem = {
        id: Date.now(),
        nama: personaTitle || "Assessment Lengkap",
        tipe: "Personality Assessment",
        tanggal: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        status: "Selesai",
        resultId: resultId
      };

      // Save to localStorage for dashboard history
      const existingHistory = JSON.parse(localStorage.getItem('assessment-history') || '[]');
      existingHistory.unshift(assessmentHistoryItem);
      localStorage.setItem('assessment-history', JSON.stringify(existingHistory));

      console.log('AssessmentQuestionsList: Assessment history saved to localStorage');

      // Navigate to results page with the new result ID
      const resultsUrl = `/results/${resultId}`;
      console.log('AssessmentQuestionsList: Navigating to results page:', resultsUrl);

      // Use window.location.href as fallback to ensure navigation works
      try {
        await router.push(resultsUrl);
        console.log('AssessmentQuestionsList: Router.push successful');
      } catch (routerError) {
        console.error('AssessmentQuestionsList: Router.push failed, using window.location.href:', routerError);
        window.location.href = resultsUrl;
      }
    } catch (error) {
      console.error('AssessmentQuestionsList: Error submitting assessment:', error);
      alert(`Terjadi kesalahan saat memproses assessment: ${error.message}. Silakan coba lagi.`);
      setIsSubmitting(false);
    }
  };

  // Current section data
  const category = categories[currentSectionIndex];
  const questions = grouped[category];
  const answered = questions.filter((q: any) => answers[q.id] != null).length;
  const total = questions.length;
  const percent = Math.round((answered / total) * 100);

  // Check if we're on the final phase and final section
  const isLastPhase = currentAssessmentIndex === 2; // VIA Character Strengths is index 2
  const isLastSection = currentSectionIndex === categories.length - 1;
  const isPhaseTransition = isLastSection && !isLastPhase; // Last section of Phase 1 or 2

  // Check if we're at the beginning of Phase 2 or Phase 3
  const isPhaseBeginning = currentSectionIndex === 0 && currentAssessmentIndex > 0;

  // Function to check if ALL questions from ALL assessments are answered
  const areAllQuestionsAnswered = () => {
    // Use the comprehensive validation function that checks all assessments
    const validation = validateAnswers(answers);
    return validation.isValid;
  };

  // Get remaining questions count for all assessments
  const getRemainingQuestions = () => {
    const validation = validateAnswers(answers);
    return validation.totalQuestions - validation.answeredQuestions;
  };

  // Legacy function for backward compatibility (now checks all questions)
  const areAllViaQuestionsAnswered = () => {
    return areAllQuestionsAnswered();
  };

  // Legacy function for backward compatibility (now returns total remaining)
  const getRemainingViaQuestions = () => {
    return getRemainingQuestions();
  };

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
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-[#64707d]">Progress:</span>
              <span className="font-semibold text-base sm:text-lg text-[#6475e9]">{answered}/{total}</span>
              <div className="w-16 sm:w-24 h-2 bg-[#eaecf0] rounded-full ml-2">
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
          {questions.map((question, idx) => {
            const isLast = idx === questions.length - 1;
            return (
              <div key={question.id}>
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
                        <button
                          onClick={isLastPhase && isLastSection && areAllQuestionsAnswered() ? handleFinishAssessment : handleNextSection}
                          disabled={(isLastPhase && isLastSection && !areAllQuestionsAnswered()) || isSubmitting}
                          className={`px-4 sm:px-6 py-2 rounded-lg border font-semibold flex items-center gap-2 w-full sm:w-auto justify-center text-sm sm:text-base ${
                            isLastPhase && isLastSection
                              ? areAllQuestionsAnswered()
                                ? isSubmitting
                                  ? 'border-[#ff5555] text-white bg-[#df4545] cursor-not-allowed'
                                  : 'border-[#ff5555] text-white bg-[#fd6661] hover:bg-[#df4545]'
                                : 'border-[#eaecf0] text-[#64707d] bg-[#f5f7fb] cursor-not-allowed'
                              : isPhaseTransition
                              ? 'border-[#6475e9] text-white bg-[#6475e9] hover:bg-[#5a6fd8]'
                              : currentSectionIndex === categories.length - 1
                              ? 'border-[#eaecf0] text-[#64707d] bg-[#f5f7fb] cursor-not-allowed'
                              : 'border-[#6475e9] text-white bg-[#6475e9] hover:bg-[#5a6fd8]'
                          }`}
                        >
                          <span>
                            {isLastPhase && isLastSection
                              ? areAllQuestionsAnswered()
                                ? isSubmitting
                                  ? 'Memproses...'
                                  : 'Akhiri Test'
                                : `Lengkapi ${getRemainingQuestions()} soal dari semua kategori`
                              : isPhaseTransition
                              ? 'Phase Selanjutnya'
                              : 'Selanjutnya'
                            }
                          </span>
                          {!(isLastPhase && isLastSection) && <span className="ml-1 text-lg">&rarr;</span>}
                          {isSubmitting && (
                            <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </button>
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
