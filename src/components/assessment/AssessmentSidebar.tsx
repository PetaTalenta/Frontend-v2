'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentTypes } from '../../data/assessmentQuestions';
import { Send } from 'lucide-react';
import { useFlaggedQuestions } from '../../hooks/useFlaggedQuestions';

interface AssessmentSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const AssessmentSidebar = memo(function AssessmentSidebar({ isOpen = false, onToggle }: AssessmentSidebarProps) {
  const router = useRouter();
  
  // Dummy state for assessment progress
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [assessmentName] = useState<string>('AI-Driven Talent Mapping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlaggedPopup, setShowFlaggedPopup] = useState(false);
  
  // Dummy progress
  const progress = { overallProgress: 25 };
  
  // Dummy answers state
  const [answers, setAnswers] = useState<{[key: number]: number}>({});

  // Dummy submit function
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Submitting assessment...');
      
      // Simulate submission process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      console.log('Assessment submitted successfully!');
      
      // Redirect to loading page
      router.push('/assessment-loading');
      
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoize assessment data grouping
  const assessmentData = useMemo(() => {
    // Get Big Five categories for Phase 1 display
    const bigFiveAssessment = assessmentTypes[0];
    const bigFiveGrouped = bigFiveAssessment.questions.reduce((acc: any, q: any) => {
      acc[q.category] = acc[q.category] || [];
      acc[q.category].push(q);
      return acc;
    }, {});
    const bigFiveCategories = ['Openness to Experience', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];

    // Get RIASEC categories for Phase 2 display
    const riasecAssessment = assessmentTypes[1];
    const riasecGrouped = riasecAssessment.questions.reduce((acc: any, q: any) => {
      acc[q.category] = acc[q.category] || [];
      acc[q.category].push(q);
      return acc;
    }, {});
    const riasecCategories = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'];

    // Get VIA categories for Phase 3 display
    const viaAssessment = assessmentTypes[2];
    const viaGrouped = viaAssessment.questions.reduce((acc: any, q: any) => {
      acc[q.category] = acc[q.category] || [];
      acc[q.category].push(q);
      return acc;
    }, {});
    const viaCategories = ['Wisdom', 'Courage', 'Humanity', 'Justice', 'Temperance', 'Transcendence'];

    return {
      bigFiveGrouped,
      bigFiveCategories,
      riasecGrouped,
      riasecCategories,
      viaGrouped,
      viaCategories
    };
  }, []);

  const handlePhaseClick = useCallback((assessmentIndex: number) => {
    console.log(`Navigate to phase ${assessmentIndex + 1}`);
    setCurrentAssessmentIndex(assessmentIndex);
    setCurrentSectionIndex(0);
  }, []);

  // Dummy helper functions
  const isPhaseAccessible = (assessmentIndex: number) => {
    // For demo purposes, allow access to all phases
    return true;
  };

  const getSectionStatus = useCallback((assessmentIndex: number, sectionIndex: number) => {
    const isComplete = Math.random() > 0.5; // Random completion status for demo
    const isActive = currentAssessmentIndex === assessmentIndex && currentSectionIndex === sectionIndex;

    return {
      isAccessible: true,
      isComplete,
      isActive,
      isNext: !isActive && !isComplete,
      reason: ''
    };
  }, [currentAssessmentIndex, currentSectionIndex]);

  const getQuestionsInSection = useCallback((assessmentIndex: number, sectionIndex: number) => {
    let questionsInSection = [];
    
    if (assessmentIndex === 0) {
      // Big Five
      const category = assessmentData.bigFiveCategories[sectionIndex];
      questionsInSection = assessmentData.bigFiveGrouped[category] || [];
    } else if (assessmentIndex === 1) {
      // RIASEC
      const category = assessmentData.riasecCategories[sectionIndex];
      questionsInSection = assessmentData.riasecGrouped[category] || [];
    } else if (assessmentIndex === 2) {
      // VIA Character Strengths
      const category = assessmentData.viaCategories[sectionIndex];
      questionsInSection = assessmentData.viaGrouped[category] || [];
    }
    
    return questionsInSection.map((q: any, index: number) => ({
      ...q,
      questionNumber: index + 1,
      isAnswered: answers[q.id] != null || Math.random() > 0.6 // Random answer status for demo
    }));
  }, [assessmentData, answers]);

  const scrollToQuestion = useCallback((questionId: number) => {
    console.log(`Scroll to question ${questionId}`);
    // Dummy scroll function
  }, []);

  const handleQuestionClick = useCallback((questionId: number) => {
    scrollToQuestion(questionId);
  }, [scrollToQuestion]);

  const getFlaggedQuestionsDetails = useCallback(() => {
    // Dummy flagged questions
    return [
      {
        id: 1,
        assessmentIndex: 0,
        assessmentName: 'Big Five Personality',
        sectionIndex: 0,
        sectionName: 'Openness to Experience',
        questionNumber: 1,
        questionText: 'Dummy flagged question text',
        isAnswered: true
      }
    ];
  }, []);

  const handleFlaggedQuestionClick = useCallback((questionDetail: any) => {
    console.log('Navigate to flagged question:', questionDetail);
    setCurrentAssessmentIndex(questionDetail.assessmentIndex);
    setCurrentSectionIndex(questionDetail.sectionIndex);
    setShowFlaggedPopup(false);
  }, []);

  const handleSectionClick = useCallback((assessmentIndex: number, sectionIndex: number) => {
    console.log(`Navigate to section ${sectionIndex} in assessment ${assessmentIndex}`);
    setCurrentAssessmentIndex(assessmentIndex);
    setCurrentSectionIndex(sectionIndex);
  }, []);

  const getSectionProgress = useCallback((assessmentIndex: number, sectionIndex?: number) => {
    const assessment = assessmentTypes[assessmentIndex];
    if (sectionIndex !== undefined) {
      // Dummy section progress
      const answered = Math.floor(Math.random() * 10) + 1;
      const total = 10;
      return { answered, total };
    } else {
      // Overall assessment progress
      const questionsInAssessment = assessment.questions;
      const answeredInAssessment = Math.floor(questionsInAssessment.length * 0.6);
      return { answered: answeredInAssessment, total: questionsInAssessment.length };
    }
  }, []);

  // Use shared flagged questions state
  const { getFlaggedQuestions } = useFlaggedQuestions();

  const areAllPhasesComplete = (answers: any) => {
    // Dummy function - always return true for demo
    return { allComplete: true, message: '' };
  };

  const handleDebugFillCurrent = useCallback(() => {
    console.log('Debug: Fill current assessment');
    alert('Debug: Semua soal assessment saat ini telah diisi otomatis!');
  }, []);

  const handleDebugFillAll = useCallback(() => {
    const confirmed = confirm('Debug: Apakah Anda yakin ingin mengisi SEMUA assessment dengan jawaban acak?');
    if (confirmed) {
      console.log('Debug: Fill all assessments');
      alert('Debug: Semua assessment telah diisi otomatis dengan jawaban acak!');
    }
  }, []);

  const toast = {
    warning: (title: string, options?: any) => {
      console.warn('Toast warning:', title, options);
      alert(`Warning: ${title}`);
    }
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
            {assessmentData.bigFiveCategories.map((category: string, index: number) => {
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
            {assessmentData.riasecCategories.map((category: string, index: number) => {
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
            {assessmentData.viaCategories.map((category: string, index: number) => {
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
      </div>

      {/* Flagged Questions Summary */}
      {getFlaggedQuestions().length > 0 && (
        <div 
          className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setShowFlaggedPopup(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">🏷️</span>
            <span className="text-sm font-semibold text-amber-800">Flagged Questions</span>
          </div>
          <div className="text-xs text-amber-700">
            {getFlaggedQuestions().length} question{getFlaggedQuestions().length !== 1 ? 's' : ''} flagged for review
          </div>
          <div className="text-xs text-amber-600 mt-1 font-medium">
            👆 Click to view details
          </div>
        </div>
      )}

      {/* Debug Buttons - Controlled by environment variable */}
      {process.env.NEXT_PUBLIC_SHOW_DEBUG_PANEL === 'true' && (
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

      {/* Flagged Questions Popup Modal */}
      {showFlaggedPopup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowFlaggedPopup(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">Flagged Questions</h3>
                  <p className="text-xs text-amber-700">
                    {getFlaggedQuestions().length} question{getFlaggedQuestions().length !== 1 ? 's' : ''} marked for review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFlaggedPopup(false)}
                className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
                aria-label="Close popup"
              >
                <svg
                  className="w-5 h-5 text-amber-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {getFlaggedQuestionsDetails().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No flagged questions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFlaggedQuestionsDetails().map((questionDetail, index) => (
                    <div
                      key={questionDetail.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleFlaggedQuestionClick(questionDetail)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                            questionDetail.isAnswered
                              ? 'bg-green-100 text-green-700 border-2 border-green-300'
                              : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                          }`}>
                            {questionDetail.questionNumber}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              Phase {questionDetail.assessmentIndex + 1}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-600 font-medium">
                              {questionDetail.sectionName}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-2 mb-2">
                            {questionDetail.questionText}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              questionDetail.isAnswered
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {questionDetail.isAnswered ? '✓ Answered' : '○ Not Answered'}
                            </span>
                            <span className="text-xs text-gray-400">
                              Click to navigate →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => setShowFlaggedPopup(false)}
                className="w-full px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default AssessmentSidebar;
