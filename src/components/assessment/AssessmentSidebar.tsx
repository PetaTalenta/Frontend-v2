'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '../../contexts/AssessmentContext';
import { assessmentTypes } from '../../data/assessmentQuestions';
import { canNavigateToSection, getOrderedCategories, validateSectionCompletion, areAllPhasesComplete } from '../../utils/assessment-calculations';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface AssessmentSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function AssessmentSidebar({ isOpen = false, onToggle }: AssessmentSidebarProps) {
  const router = useRouter();
  const {
    currentAssessmentIndex,
    currentSectionIndex,
    setCurrentAssessmentIndex,
    setCurrentSectionIndex,
    answers,
    getProgress,
    getFlaggedQuestions,
    debugFillCurrentAssessment,
    debugFillAllAssessments,
    getCurrentAssessment
  } = useAssessment();

  const progress = getProgress();
  const [assessmentName, setAssessmentName] = useState<string>('AI-Driven Talent Mapping');

  // State for submission tracking
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug functions
  const handleDebugFillCurrent = () => {
    const currentAssessment = getCurrentAssessment();
    debugFillCurrentAssessment();
    alert(`Debug: Semua ${currentAssessment.questions.length} soal ${currentAssessment.name} telah diisi otomatis!`);
  };

  const handleDebugFillAll = () => {
    const confirmed = confirm('Debug: Apakah Anda yakin ingin mengisi SEMUA assessment (Big Five, RIASEC, VIA) dengan jawaban acak?');
    if (confirmed) {
      debugFillAllAssessments();
      alert('Debug: Semua assessment telah diisi otomatis dengan jawaban acak!');
    }
  };

  // Submit assessment function
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Check if all three phases are complete
      const phaseValidation = areAllPhasesComplete(answers);
      
      if (!phaseValidation.allComplete) {
        toast.error(phaseValidation.message || 'Harap selesaikan semua fase assessment');
        setIsSubmitting(false);
        return;
      }

      // Save answers and assessment name to localStorage for the loading page
      if (process.env.NODE_ENV === 'development') {
        console.log('AssessmentSidebar: Saving answers to localStorage for loading page...');
      }
      localStorage.setItem('assessment-answers', JSON.stringify(answers));
      localStorage.setItem('assessment-name', assessmentName);
      localStorage.setItem('assessment-submission-time', new Date().toISOString());

      // Show success message
      toast.success('Assessment berhasil dikirim! Mengarahkan ke halaman loading...');

      // Redirect to loading page
      if (process.env.NODE_ENV === 'development') {
        console.log('AssessmentSidebar: Redirecting to /assessment-loading...');
      }
      router.push('/assessment-loading');

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to submit assessment:', error);
      }
      toast.error('Gagal mengirim assessment. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  // Get Big Five categories for Phase 1 display
  const bigFiveAssessment = assessmentTypes[0];
  const bigFiveGrouped = bigFiveAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const bigFiveCategories = getOrderedCategories(bigFiveAssessment.id, bigFiveAssessment.questions);

  // Get RIASEC categories for Phase 2 display
  const riasecAssessment = assessmentTypes[1];
  const riasecGrouped = riasecAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const riasecCategories = getOrderedCategories(riasecAssessment.id, riasecAssessment.questions);

  // Get VIA categories for Phase 3 display
  const viaAssessment = assessmentTypes[2];
  const viaGrouped = viaAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const viaCategories = Object.keys(viaGrouped);

  const handlePhaseClick = (assessmentIndex: number) => {
    // For already worked-on phases, find the last completed section or first incomplete section
    const targetAssessment = assessmentTypes[assessmentIndex];
    let targetSectionIndex = 0;

    // Check if this phase has been worked on before
    const hasAnsweredInPhase = targetAssessment.questions.some(q => 
      answers[q.id] !== null && answers[q.id] !== undefined
    );

    if (hasAnsweredInPhase && assessmentIndex !== currentAssessmentIndex) {
      // Find the appropriate section to navigate to:
      // 1. First incomplete section, or
      // 2. Last section if all are complete
      const phaseCategories = getOrderedCategories(targetAssessment.id, targetAssessment.questions);
      
      for (let i = 0; i < phaseCategories.length; i++) {
        const sectionValidation = validateSectionCompletion(answers, assessmentIndex, i);
        if (!sectionValidation.isComplete) {
          targetSectionIndex = i;
          break;
        }
        // If this is the last section and it's complete, stay on it
        if (i === phaseCategories.length - 1 && sectionValidation.isComplete) {
          targetSectionIndex = i;
        }
      }
    }

    // Check if navigation to this phase and section is allowed
    const navigationCheck = canNavigateToSection(
      answers,
      currentAssessmentIndex,
      currentSectionIndex,
      assessmentIndex,
      targetSectionIndex
    );

    if (!navigationCheck.canNavigate) {
      toast.warning('Navigasi Tidak Diizinkan', {
        description: navigationCheck.reason || 'Selesaikan bagian saat ini terlebih dahulu',
        duration: 4000,
      });
      return;
    }

    setCurrentAssessmentIndex(assessmentIndex);
    setCurrentSectionIndex(targetSectionIndex);
  };

  // Helper function to check if a phase is accessible
  const isPhaseAccessible = (assessmentIndex: number) => {
    const navigationCheck = canNavigateToSection(
      answers,
      currentAssessmentIndex,
      currentSectionIndex,
      assessmentIndex,
      0
    );
    return navigationCheck.canNavigate;
  };

  // Helper function to get section status
  const getSectionStatus = (assessmentIndex: number, sectionIndex: number) => {
    const navigationCheck = canNavigateToSection(
      answers,
      currentAssessmentIndex,
      currentSectionIndex,
      assessmentIndex,
      sectionIndex
    );

    const sectionProgress = getSectionProgress(assessmentIndex, sectionIndex);
    const isComplete = sectionProgress.answered === sectionProgress.total;
    const isActive = currentAssessmentIndex === assessmentIndex && currentSectionIndex === sectionIndex;

    return {
      isAccessible: navigationCheck.canNavigate,
      isComplete,
      isActive,
      isNext: !isActive && navigationCheck.canNavigate && !isComplete,
      reason: navigationCheck.reason
    };
  };

  // Helper function to get questions in a section with their status
  const getQuestionsInSection = (assessmentIndex: number, sectionIndex: number) => {
    if (assessmentIndex === 0) {
      // Big Five
      const category = bigFiveCategories[sectionIndex];
      const questionsInSection = bigFiveGrouped[category] || [];
      return questionsInSection.map((q: any, index: number) => ({
        ...q,
        questionNumber: index + 1,
        isAnswered: answers[q.id] != null
      }));
    } else if (assessmentIndex === 1) {
      // RIASEC
      const category = riasecCategories[sectionIndex];
      const questionsInSection = riasecGrouped[category] || [];
      return questionsInSection.map((q: any, index: number) => ({
        ...q,
        questionNumber: index + 1,
        isAnswered: answers[q.id] != null
      }));
    } else if (assessmentIndex === 2) {
      // VIA Character Strengths
      const category = viaCategories[sectionIndex];
      const questionsInSection = viaGrouped[category] || [];
      return questionsInSection.map((q: any, index: number) => ({
        ...q,
        questionNumber: index + 1,
        isAnswered: answers[q.id] != null
      }));
    }
    return [];
  };

  // Helper function to scroll to specific question
  const scrollToQuestion = (questionId: number) => {
    // Find the question element by its ID
    const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
    if (questionElement) {
      questionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  // Handle click on question number
  const handleQuestionClick = (questionId: number) => {
    scrollToQuestion(questionId);
  };

  const handleSectionClick = (assessmentIndex: number, sectionIndex: number) => {
    // Check if navigation to this section is allowed
    const navigationCheck = canNavigateToSection(
      answers,
      currentAssessmentIndex,
      currentSectionIndex,
      assessmentIndex,
      sectionIndex
    );

    if (!navigationCheck.canNavigate) {
      toast.warning('Navigasi Tidak Diizinkan', {
        description: navigationCheck.reason || 'Selesaikan bagian saat ini terlebih dahulu',
        duration: 4000,
      });
      return;
    }

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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && onToggle) {
        const sidebar = document.getElementById('assessment-sidebar');
        const target = event.target as Node;
        if (sidebar && !sidebar.contains(target)) {
          onToggle();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" />
      )}

      {/* Sidebar */}
      <aside
        id="assessment-sidebar"
        className={`
          fixed lg:relative top-0 left-0 h-full lg:h-screen w-[280px] lg:w-[300px]
          bg-white border-r border-[#eaecf0] p-4 lg:p-6
          flex flex-col gap-4 overflow-y-auto z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Assessment Progress</h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Desktop Title */}
        <h2 className="hidden lg:block font-bold text-xl mb-4 text-center">Assessment Progress</h2>

        {/* Content */}
        <div className="flex flex-col gap-4">

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
              const categoryNames: Record<string, string> = {
                'Openness to Experience': 'Openness to Experience',
                'Conscientiousness': 'Conscientiousness',
                'Extraversion': 'Extraversion',
                'Agreeableness': 'Agreeableness',
                'Neuroticism': 'Neuroticism'
              };

              // Get section status
              const status = getSectionStatus(0, index);

              const questionsInSection = getQuestionsInSection(0, index);

              return (
                <div key={category} className="w-full">
                  <div
                    className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all w-full relative ${
                      status.isActive
                        ? 'bg-[#e7eaff] border border-[#6475e9]'
                        : status.isComplete
                          ? 'bg-green-50 border border-green-200 hover:bg-green-100 cursor-pointer'
                          : status.isNext
                            ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100 cursor-pointer ring-2 ring-blue-300 ring-opacity-50'
                            : status.isAccessible
                              ? 'hover:bg-[#f0f1f3] cursor-pointer'
                              : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (status.isAccessible) {
                        handleSectionClick(0, index);
                      }
                    }}
                    title={!status.isAccessible ? (status.reason || 'Selesaikan bagian saat ini terlebih dahulu') :
                           status.isNext ? 'Bagian selanjutnya yang tersedia' : ''}
                  >
                    <div className="flex items-center gap-2">
                      {status.isNext && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      {status.isComplete && (
                        <div >

                        </div>
                      )}
                      <span className={`text-sm ${
                        status.isActive
                          ? 'text-[#6475e9] font-semibold'
                          : status.isComplete
                            ? 'text-green-700 font-medium'
                            : status.isNext
                              ? 'text-blue-700 font-medium'
                              : status.isAccessible
                                ? 'text-[#64707d]'
                                : 'text-[#9ca3af]'
                      }`}>
                        {categoryNames[category] || category}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold border ${
                      status.isActive
                        ? 'bg-white text-[#6475e9] border-[#e7eaff]'
                        : status.isComplete
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : status.isNext
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : status.isAccessible
                              ? 'bg-[#f5f7fb] text-[#64707d] border-[#eaecf0]'
                              : 'bg-[#f3f4f6] text-[#9ca3af] border-[#d1d5db]'
                    }`}>
                      {sectionProgress.answered}/{sectionProgress.total}
                    </span>
                  </div>

                  {/* Question Numbers - Show only when section is active */}
                  {status.isActive && (
                    <div className="mt-2 px-3">
                      <div className="grid grid-cols-5 gap-1">
                        {questionsInSection.map((question: any) => (
                          <div
                            key={question.id}
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium border cursor-pointer transition-all hover:scale-105 relative ${
                              question.isAnswered
                                ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                            }`}
                            title={`Soal ${question.questionNumber}${question.isAnswered ? ' (Sudah dijawab)' : ' (Belum dijawab)'} - Klik untuk menuju soal`}
                            onClick={() => handleQuestionClick(question.id)}
                          >
                            {question.questionNumber}
                            {getFlaggedQuestions().includes(question.id) && (
                              <span className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-full border-2 border-white" title="Soal ini ditandai (flag)"></span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Phase 2 - RIASEC */}
      <div className={`rounded-xl p-4 mb-2 border transition-all ${
        currentAssessmentIndex === 1
          ? 'bg-[#f5f7fb] border-[#e7eaff]'
          : isPhaseAccessible(1)
            ? 'bg-white border-[#eaecf0] hover:bg-[#f9fafb] cursor-pointer'
            : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
      }`}
      onClick={() => {
        if (isPhaseAccessible(1)) {
          handlePhaseClick(1);
        } else {
          toast.warning('Assessment Belum Tersedia', {
            description: 'Selesaikan semua bagian di Big Five Personality terlebih dahulu',
            duration: 4000,
          });
        }
      }}
      title={!isPhaseAccessible(1) ? 'Selesaikan Big Five Personality terlebih dahulu' : ''}
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
              const categoryNames: Record<string, string> = {
                'Realistic': 'Realistic',
                'Investigative': 'Investigative',
                'Artistic': 'Artistic',
                'Social': 'Social',
                'Enterprising': 'Enterprising',
                'Conventional': 'Conventional'
              };

              // Get section status
              const status = getSectionStatus(1, index);

              const questionsInSection = getQuestionsInSection(1, index);

              return (
                <div key={category} className="w-full">
                  <div
                    className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all w-full relative ${
                      status.isActive
                        ? 'bg-[#e7eaff] border border-[#6475e9]'
                        : status.isComplete
                          ? 'bg-green-50 border border-green-200 hover:bg-green-100 cursor-pointer'
                          : status.isNext
                            ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100 cursor-pointer ring-2 ring-blue-300 ring-opacity-50'
                            : status.isAccessible
                              ? 'hover:bg-[#f0f1f3] cursor-pointer'
                              : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (status.isAccessible) {
                        handleSectionClick(1, index);
                      }
                    }}
                    title={!status.isAccessible ? (status.reason || 'Selesaikan bagian saat ini terlebih dahulu') :
                           status.isNext ? 'Bagian selanjutnya yang tersedia' : ''}
                  >
                    <div className="flex items-center gap-2">
                      {status.isNext && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      {status.isComplete && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className={`text-sm ${
                        status.isActive
                          ? 'text-[#6475e9] font-semibold'
                          : status.isComplete
                            ? 'text-green-700 font-medium'
                            : status.isNext
                              ? 'text-blue-700 font-medium'
                              : status.isAccessible
                                ? 'text-[#64707d]'
                                : 'text-[#9ca3af]'
                      }`}>
                        {categoryNames[category] || category}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold border ${
                      status.isActive
                        ? 'bg-white text-[#6475e9] border-[#e7eaff]'
                        : status.isComplete
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : status.isNext
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : status.isAccessible
                              ? 'bg-[#f5f7fb] text-[#64707d] border-[#eaecf0]'
                              : 'bg-[#f3f4f6] text-[#9ca3af] border-[#d1d5db]'
                    }`}>
                      {sectionProgress.answered}/{sectionProgress.total}
                    </span>
                  </div>

                  {/* Question Numbers - Show only when section is active */}
                  {status.isActive && (
                    <div className="mt-2 px-3">
                      <div className="grid grid-cols-5 gap-1">
                        {questionsInSection.map((question: any) => (
                          <div
                            key={question.id}
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium border cursor-pointer transition-all hover:scale-105 ${
                              question.isAnswered
                                ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                            }`}
                            title={`Soal ${question.questionNumber}${question.isAnswered ? ' (Sudah dijawab)' : ' (Belum dijawab)'} - Klik untuk menuju soal`}
                            onClick={() => handleQuestionClick(question.id)}
                          >
                            {question.questionNumber}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Phase 3 - VIA Character Strengths */}
      <div className={`rounded-xl p-4 mb-2 border transition-all ${
        currentAssessmentIndex === 2
          ? 'bg-[#f5f7fb] border-[#e7eaff]'
          : isPhaseAccessible(2)
            ? 'bg-white border-[#eaecf0] hover:bg-[#f9fafb] cursor-pointer'
            : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
      }`}
      onClick={() => {
        if (isPhaseAccessible(2)) {
          handlePhaseClick(2);
        } else {
          toast.warning('Assessment Belum Tersedia', {
            description: 'Selesaikan semua bagian di RIASEC Holland Codes terlebih dahulu',
            duration: 4000,
          });
        }
      }}
      title={!isPhaseAccessible(2) ? 'Selesaikan RIASEC Holland Codes terlebih dahulu' : ''}
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
              const categoryNames: Record<string, string> = {
                'Wisdom': 'Wisdom',
                'Courage': 'Courage',
                'Humanity': 'Humanity',
                'Justice': 'Justice',
                'Temperance': 'Temperance',
                'Transcendence': 'Transcendence'
              };

              // Get section status
              const status = getSectionStatus(2, index);

              const questionsInSection = getQuestionsInSection(2, index);

              return (
                <div key={category} className="w-full">
                  <div
                    className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all w-full relative ${
                      status.isActive
                        ? 'bg-[#e7eaff] border border-[#6475e9]'
                        : status.isComplete
                          ? 'bg-green-50 border border-green-200 hover:bg-green-100 cursor-pointer'
                          : status.isNext
                            ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100 cursor-pointer ring-2 ring-blue-300 ring-opacity-50'
                            : status.isAccessible
                              ? 'hover:bg-[#f0f1f3] cursor-pointer'
                              : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (status.isAccessible) {
                        handleSectionClick(2, index);
                      }
                    }}
                    title={!status.isAccessible ? (status.reason || 'Selesaikan bagian saat ini terlebih dahulu') :
                           status.isNext ? 'Bagian selanjutnya yang tersedia' : ''}
                  >
                    <div className="flex items-center gap-2">
                      {status.isNext && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      {status.isComplete && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className={`text-sm ${
                        status.isActive
                          ? 'text-[#6475e9] font-semibold'
                          : status.isComplete
                            ? 'text-green-700 font-medium'
                            : status.isNext
                              ? 'text-blue-700 font-medium'
                              : status.isAccessible
                                ? 'text-[#64707d]'
                                : 'text-[#9ca3af]'
                      }`}>
                        {categoryNames[category] || category}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold border ${
                      status.isActive
                        ? 'bg-white text-[#6475e9] border-[#e7eaff]'
                        : status.isComplete
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : status.isNext
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : status.isAccessible
                              ? 'bg-[#f5f7fb] text-[#64707d] border-[#eaecf0]'
                              : 'bg-[#f3f4f6] text-[#9ca3af] border-[#d1d5db]'
                    }`}>
                      {sectionProgress.answered}/{sectionProgress.total}
                    </span>
                  </div>

                  {/* Question Numbers - Show only when section is active */}
                  {status.isActive && (
                    <div className="mt-2 px-3">
                      <div className="grid grid-cols-4 gap-1">
                        {questionsInSection.map((question: any) => (
                          <div
                            key={question.id}
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium border cursor-pointer transition-all hover:scale-105 ${
                              question.isAnswered
                                ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                            }`}
                            title={`Soal ${question.questionNumber}${question.isAnswered ? ' (Sudah dijawab)' : ' (Belum dijawab)'} - Klik untuk menuju soal`}
                            onClick={() => handleQuestionClick(question.id)}
                          >
                            {question.questionNumber}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Flagged Questions Summary */}
      {getFlaggedQuestions().length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">🏷️</span>
            <span className="text-sm font-semibold text-amber-800">Flagged Questions</span>
          </div>
          <div className="text-xs text-amber-700">
            {getFlaggedQuestions().length} question{getFlaggedQuestions().length !== 1 ? 's' : ''} flagged for review
          </div>
        </div>
      )}

      {/* Debug Buttons - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-600">🐛</span>
            <span className="text-sm font-semibold text-gray-800">Debug Tools</span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDebugFillCurrent}
              className="w-full px-3 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
              title="Debug: Isi assessment saat ini"
            >
              🐛 Fill Current Assessment
            </button>
            <button
              onClick={handleDebugFillAll}
              className="w-full px-3 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
              title="Debug: Isi semua assessment"
            >
              🐛 Fill All Assessments
            </button>
          </div>
        </div>
      )}

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

      {/* Submit Assessment Button */}
      <div className="pt-4 border-t border-[#eaecf0]">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !areAllPhasesComplete(answers).allComplete}
          className="w-full px-4 py-2 rounded-lg bg-[#6475e9] hover:bg-[#5a6acf] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          title={!areAllPhasesComplete(answers).allComplete ? 'Selesaikan semua 3 fase (Big Five, RIASEC, VIA) untuk submit' : 'Submit assessment untuk mendapatkan hasil'}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Mengirim...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Assessment
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
