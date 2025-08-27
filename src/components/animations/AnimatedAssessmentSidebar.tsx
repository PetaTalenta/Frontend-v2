'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssessment } from '../../contexts/AssessmentContext';
import { assessmentTypes } from '../../data/assessmentQuestions';
import { canNavigateToSection, isAssessmentComplete, getNextAvailableSection, getOrderedCategories } from '../../utils/assessment-calculations';
import { toast } from 'sonner';

export default function AnimatedAssessmentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    currentAssessmentIndex,
    currentSectionIndex,
    setCurrentAssessmentIndex,
    setCurrentSectionIndex,
    answers,
    getProgress,
    getFlaggedQuestions
  } = useAssessment();

  const progress = getProgress();

  // Animation variants
  const sidebarVariants = {
    expanded: {
      width: "280px",
      transition: {
        duration: 0.3,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    },
    collapsed: {
      width: "60px",
      transition: {
        duration: 0.3,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    }
  };

  const contentVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        delay: 0.1
      }
    },
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const phaseVariants = {
    inactive: {
      scale: 1,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    },
    active: {
      scale: 1.02,
      boxShadow: "0 4px 12px rgba(100, 117, 233, 0.15)",
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.01,
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
      transition: { duration: 0.2 }
    }
  };

  const sectionVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.95
    },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    }),
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const progressBarVariants = {
    initial: { scaleX: 0 },
    animate: (progress: number) => ({
      scaleX: progress / 100,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    })
  };

  // Get current assessment categories and their question counts
  const currentAssessment = assessmentTypes[currentAssessmentIndex];
  const currentGrouped = currentAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  // Use ordered categories instead of Object.keys to ensure consistency
  const currentCategories = getOrderedCategories(currentAssessment.id, currentAssessment.questions);

  // Get Big Five categories for Phase 1 display
  const bigFiveAssessment = assessmentTypes[0];
  const bigFiveGrouped = bigFiveAssessment.questions.reduce((acc: any, q: any) => {
    acc[q.category] = acc[q.category] || [];
    acc[q.category].push(q);
    return acc;
  }, {});
  const bigFiveCategories = getOrderedCategories(bigFiveAssessment.id, bigFiveAssessment.questions);

  const handlePhaseClick = (assessmentIndex: number) => {
    const navigationCheck = canNavigateToSection(
      answers,
      currentAssessmentIndex,
      currentSectionIndex,
      assessmentIndex,
      0
    );

    if (!navigationCheck.canNavigate) {
      toast.warning('Navigasi Tidak Diizinkan', {
        description: navigationCheck.reason || 'Selesaikan bagian saat ini terlebih dahulu',
        duration: 4000,
      });
      return;
    }

    setCurrentAssessmentIndex(assessmentIndex);
    setCurrentSectionIndex(0);
  };

  const getSectionProgress = (assessmentIndex: number, sectionIndex?: number) => {
    const assessment = assessmentTypes[assessmentIndex];
    if (sectionIndex !== undefined) {
      if (assessmentIndex === 0) {
        const category = bigFiveCategories[sectionIndex];
        const questionsInSection = bigFiveGrouped[category] || [];
        const answeredInSection = questionsInSection.filter((q: any) => answers[q.id] != null).length;
        return { answered: answeredInSection, total: questionsInSection.length };
      }
    } else {
      const questionsInAssessment = assessment.questions;
      const answeredInAssessment = questionsInAssessment.filter((q: any) => answers[q.id] != null).length;
      return { answered: answeredInAssessment, total: questionsInAssessment.length };
    }
    return { answered: 0, total: 0 };
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      className="h-screen bg-white border-r border-[#eaecf0] p-4 lg:p-6 flex flex-col gap-4 overflow-hidden"
    >
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.h2
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="font-bold text-xl"
            >
              Assessment Progress
            </motion.h2>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.svg
            className="w-4 h-4"
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </motion.svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col gap-4 overflow-y-auto"
          >
            {/* Phase 1 - Big Five */}
            <motion.div
              variants={phaseVariants}
              animate={currentAssessmentIndex === 0 ? "active" : "inactive"}
              whileHover="hover"
              className={`rounded-xl p-4 border cursor-pointer ${
                currentAssessmentIndex === 0
                  ? 'bg-[#f5f7fb] border-[#e7eaff]'
                  : 'bg-white border-[#eaecf0]'
              }`}
              onClick={() => handlePhaseClick(0)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Phase 1</span>
                <motion.span
                  key={`${getSectionProgress(0).answered}-${getSectionProgress(0).total}`}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xs text-[#64707d] font-medium"
                >
                  {getSectionProgress(0).answered}/{getSectionProgress(0).total}
                </motion.span>
              </div>
              
              <div className="text-xs text-[#64707d] mb-2">Big Five Personality</div>
              
              <div className="w-full h-2 bg-[#eaecf0] rounded-full mb-2 overflow-hidden">
                <motion.div
                  variants={progressBarVariants}
                  initial="initial"
                  animate="animate"
                  custom={Math.round((getSectionProgress(0).answered / getSectionProgress(0).total) * 100)}
                  className="h-2 bg-[#6475e9] rounded-full origin-left"
                />
              </div>

              {/* Sub-phases for Big Five */}
              <AnimatePresence>
                {currentAssessmentIndex === 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 pt-2">
                      {bigFiveCategories.map((category, index) => {
                        const sectionProgress = getSectionProgress(0, index);
                        const isActive = currentSectionIndex === index;
                        
                        return (
                          <motion.div
                            key={category}
                            custom={index}
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={`flex items-center justify-between rounded-lg px-3 py-2 transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#e7eaff] border border-[#6475e9]'
                                : 'hover:bg-[#f0f1f3]'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className={`text-sm ${
                              isActive ? 'text-[#6475e9] font-semibold' : 'text-[#64707d]'
                            }`}>
                              {category}
                            </span>
                            <motion.span
                              key={`${sectionProgress.answered}-${sectionProgress.total}`}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              className={`rounded-full px-2 py-1 text-xs font-bold ${
                                isActive
                                  ? 'bg-white text-[#6475e9]'
                                  : 'bg-[#f5f7fb] text-[#64707d]'
                              }`}
                            >
                              {sectionProgress.answered}/{sectionProgress.total}
                            </motion.span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Total Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-auto pt-4"
            >
              <div className="text-center text-sm font-semibold mb-2">Total Progress</div>
              <div className="w-full h-2 bg-[#eaecf0] rounded-full overflow-hidden">
                <motion.div
                  variants={progressBarVariants}
                  initial="initial"
                  animate="animate"
                  custom={progress.overallProgress}
                  className="h-2 bg-[#6475e9] rounded-full origin-left"
                />
              </div>
              <motion.div
                key={progress.overallProgress}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center text-xs text-[#64707d] mt-1"
              >
                {progress.overallProgress}% Complete
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
