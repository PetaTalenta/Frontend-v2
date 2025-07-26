'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scaleConfigurations, assessmentTypes } from '../../data/assessmentQuestions';
import AssessmentQuestionCard from './AssessmentQuestionCard';
import { useAssessment } from '../../contexts/AssessmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { submitAssessmentFlexible } from '../../services/assessment-api';

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

  const handleFinishAssessment = async () => {
    if (isSubmitting) return;

    console.log('AssessmentQuestionsList: Starting assessment submission...');
    setIsSubmitting(true);

    try {
      console.log('AssessmentQuestionsList: Submitting assessment with answers:', Object.keys(answers).length, 'questions answered');

      // Submit assessment answers and get result ID (flexible validation)
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
      alert(`Terjadi kesalahan saat menyimpan hasil assessment: ${error.message}. Silakan coba lagi.`);
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

  // Function to check if all VIA Character Strengths questions are answered
  const areAllViaQuestionsAnswered = () => {
    if (currentAssessmentIndex !== 2) return true; // Not on VIA phase, so this check doesn't apply

    const viaAssessment = assessmentTypes[2]; // VIA Character Strengths is at index 2
    const allViaQuestionIds = viaAssessment.questions.map(q => q.id);

    // Check if all VIA questions have non-null answers
    return allViaQuestionIds.every(questionId => answers[questionId] != null);
  };

  // Get remaining questions count for VIA assessment
  const getRemainingViaQuestions = () => {
    if (currentAssessmentIndex !== 2) return 0;

    const viaAssessment = assessmentTypes[2];
    const allViaQuestionIds = viaAssessment.questions.map(q => q.id);
    const answeredCount = allViaQuestionIds.filter(questionId => answers[questionId] != null).length;

    return allViaQuestionIds.length - answeredCount;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full mb-12">
        {/* Section Header - matching card width */}
        <div className="w-[1400px] mx-auto mb-8">
          <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="inline-block px-4 py-2 rounded-full bg-[#e7eaff] text-[#6475e9] text-sm font-semibold">
                {currentAssessment.name}
              </span>
              <h2 className="font-bold text-2xl text-[#313131]">{category}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#64707d]">Progress:</span>
              <span className="font-semibold text-lg text-[#6475e9]">{answered}/{total}</span>
              <div className="w-24 h-2 bg-[#eaecf0] rounded-full ml-2">
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
                    <div className={`flex items-center mt-2 px-2 ${
                      currentAssessmentIndex === 0 && currentSectionIndex === 0
                        ? 'justify-end'
                        : 'justify-between'
                    }`}>
                      {/* Hide Previous button at the very beginning (Phase 1, Openness to Experience) */}
                      {!(currentAssessmentIndex === 0 && currentSectionIndex === 0) && (
                        <button
                          onClick={isPhaseBeginning ? handlePrevPhase : handlePrevSection}
                          className="px-6 py-2 rounded-lg border font-medium flex items-center gap-2 border-[#6475e9] text-[#6475e9] bg-white hover:bg-[#f2f4ff]"
                        >
                          <span className="text-lg">&larr;</span>
                          <span>{isPhaseBeginning ? 'Phase Sebelumnya' : 'Sebelumnya'}</span>
                        </button>
                      )}
                      <div className="flex items-center gap-4">
                        {/* "Lewati" button removed from last question card */}
                        <button
                          onClick={isLastPhase && isLastSection && areAllViaQuestionsAnswered() ? handleFinishAssessment : handleNextSection}
                          disabled={(isLastPhase && isLastSection && !areAllViaQuestionsAnswered()) || isSubmitting}
                          className={`px-6 py-2 rounded-lg border font-semibold flex items-center gap-2 ${
                            isLastPhase && isLastSection
                              ? areAllViaQuestionsAnswered()
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
                              ? areAllViaQuestionsAnswered()
                                ? isSubmitting
                                  ? 'Memproses...'
                                  : 'Akhiri Test'
                                : `Lengkapi ${getRemainingViaQuestions()} soal lagi`
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
