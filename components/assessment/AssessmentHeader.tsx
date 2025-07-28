'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '../../contexts/AssessmentContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToken } from '../../contexts/TokenContext';
import { assessmentTypes } from '../../data/assessmentQuestions';
import { validateAnswers } from '../../utils/assessment-calculations';
import { submitAssessment, submitAssessmentFlexible } from '../../services/assessment-api';
import { debugNavigate, navigationDebugger } from '../../utils/navigation-debug';
import { getTokenBalanceErrorMessage } from '../../utils/token-balance';
import {
  showAssessmentSubmissionStart,
  showAssessmentSubmissionResult,
  showTokenError
} from '../../utils/token-notifications';
import { useAssessmentSubmission } from '../../hooks/useAssessmentSubmission';
import { addToAssessmentHistory } from '../../utils/assessment-history';
import { withSubmissionGuard, hasRecentSubmission, markRecentSubmission } from '../../utils/submission-guard';

interface AssessmentHeaderProps {
  currentQuestion?: number;
  totalQuestions?: number;
  assessmentName?: string;
  phase?: string;
}

export default function AssessmentHeader({
  currentQuestion = 1,
  totalQuestions = 44,
  assessmentName = "Big Five Personality",
  phase = "Phase 1"
}: AssessmentHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshTokenBalance } = useToken();
  const { debugFillAllAssessments, debugFillCurrentAssessment, getCurrentAssessment, answers } = useAssessment();
  const [isSaving, setIsSaving] = useState(false);

  // Assessment submission hook for loading page
  const { submitAssessment: submitToLoadingPage } = useAssessmentSubmission({
    assessmentName: 'AI-Driven Talent Mapping',
    onSubmissionStart: () => {
      console.log('Redirecting to loading page from header...');
    },
    onSubmissionError: (error) => {
      console.error('Failed to redirect to loading page:', error);
      setIsSaving(false);
    }
  });

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

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

  const handleDebugFinishAssessment = async () => {
    const confirmed = confirm('Debug: Apakah Anda yakin ingin menyelesaikan assessment dan langsung ke results page?');
    if (confirmed) {
      // Fill all assessments first
      debugFillAllAssessments();

      // Wait a bit for state to update
      setTimeout(async () => {
        try {
          console.log('Debug: Starting assessment submission...');
          const { resultId, personaTitle } = await submitAssessmentFlexible(answers, user?.id, refreshTokenBalance);

          console.log('Debug: Assessment submitted, navigating to results...');
          const resultsUrl = `/results/${resultId}`;

          // Use window.location.href for immediate navigation
          window.location.href = resultsUrl;
        } catch (error) {
          console.error('Debug: Error submitting assessment:', error);

          // Handle specific error types
          if (error.response?.status === 402) {
            alert('Debug Error: Insufficient token balance. You need at least 1 token to submit an assessment.');
          } else if (error.message?.includes('token balance')) {
            alert('Debug Error: ' + error.message + ' The system will use local analysis instead.');
          } else {
            alert(`Debug Error: ${error.message}`);
          }
        }
      }, 1000);
    }
  };

  const handleSaveAndExit = async () => {
    setIsSaving(true);

    try {
      console.log('AssessmentHeader: Starting save and exit process...');
      console.log('AssessmentHeader: Current answers count:', Object.keys(answers).length);

      // Validate if all questions are answered
      const validation = validateAnswers(answers);
      console.log('AssessmentHeader: Validation result:', validation);

      if (validation.isValid) {
        // All questions answered - redirect to loading page for processing
        console.log('AssessmentHeader: All questions answered, redirecting to loading page...');
        await submitToLoadingPage(answers, 'AI-Driven Talent Mapping');
        console.log('AssessmentHeader: Successfully redirected to loading page, stopping execution to prevent double submission');
        return; // CRITICAL: Stop execution here to prevent double submission
      } else if (validation.answeredQuestions >= validation.totalQuestions * 0.8) {
        // 80%+ completion - offer loading page option
        const completionRate = Math.round((validation.answeredQuestions / validation.totalQuestions) * 100);
        const useLoadingPage = confirm(
          `Assessment ${completionRate}% selesai.\n\n` +
          `Pilih metode submit:\n` +
          `• OK - Gunakan halaman loading (recommended)\n` +
          `• Cancel - Submit langsung di halaman ini`
        );

        if (useLoadingPage) {
          console.log('AssessmentHeader: User chose loading page for partial assessment...');
          await submitToLoadingPage(answers, 'AI-Driven Talent Mapping');
          console.log('AssessmentHeader: Successfully redirected to loading page, stopping execution to prevent double submission');
          return; // CRITICAL: Stop execution here to prevent double submission
        }
        // If user chose not to use loading page, continue with original flow
        console.log('AssessmentHeader: User chose direct submission, continuing with original flow...');
      }

      // Original flow for less than 80% completion or user preference
      console.log('AssessmentHeader: Executing direct submission path (not using loading page)');
      if (validation.isValid) {
        // Check for recent submissions to prevent duplicates
        if (hasRecentSubmission(answers)) {
          console.warn('AssessmentHeader: Recent submission detected, preventing duplicate');
          alert('Assessment sedang diproses. Mohon tunggu sebentar sebelum mencoba lagi.');
          return;
        }

        console.log('AssessmentHeader: Starting direct submission with submission guard...');
        // Use submission guard to prevent duplicates
        const result = await withSubmissionGuard(answers, async () => {
          // Token validation is now handled by backend
          console.log('AssessmentHeader: Inside submission guard - submitting assessment (token validation handled by backend)...');

          // Show submission start notification
          showAssessmentSubmissionStart();

          // Mark recent submission
          markRecentSubmission(answers);

          // All questions answered - submit assessment and go to results
          console.log('AssessmentHeader: Calling submitAssessment API...');
          return await submitAssessment(answers, user?.id, refreshTokenBalance);
        });

        const { resultId, personaTitle } = result;

        // Show success notification
        showAssessmentSubmissionResult(true, `Assessment completed successfully! Persona: ${personaTitle}`);

        // Add assessment to dashboard history with duplicate prevention
        addToAssessmentHistory({
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
        });

        // Navigate to results page with enhanced debugging
        const resultsUrl = `/results/${resultId}`;
        console.log('AssessmentHeader: Navigating to results page:', resultsUrl);

        const navigationSuccess = await debugNavigate(router, resultsUrl, {
          source: 'assessment_completion',
          assessmentType: 'full',
          resultId
        });

        if (!navigationSuccess) {
          console.error('AssessmentHeader: All navigation methods failed');
          alert('Tidak dapat membuka halaman hasil. Silakan refresh halaman dan coba lagi.');
        }
      } else {
        // Not all questions answered - ask user if they want to submit anyway or save progress
        const completionRate = Math.round((validation.answeredQuestions / validation.totalQuestions) * 100);
        const shouldSubmit = confirm(
          `Assessment belum lengkap (${completionRate}% selesai). \n\n` +
          `Pilih:\n` +
          `• OK - Submit assessment sekarang dan lihat hasil\n` +
          `• Cancel - Simpan progress dan kembali ke dashboard`
        );

        if (shouldSubmit && validation.answeredQuestions >= validation.totalQuestions * 0.5) {
          // User wants to submit with partial answers and has at least 50% completion
          try {
            // Check for recent submissions to prevent duplicates
            if (hasRecentSubmission(answers)) {
              console.warn('AssessmentHeader: Recent flexible submission detected, preventing duplicate');
              alert('Assessment sedang diproses. Mohon tunggu sebentar sebelum mencoba lagi.');
              return;
            }

            console.log('AssessmentHeader: Starting flexible submission with submission guard...');
            // Use submission guard to prevent duplicates
            const result = await withSubmissionGuard(answers, async () => {
              // Token validation is now handled by backend
              console.log('AssessmentHeader: Inside submission guard - submitting flexible assessment (token validation handled by backend)...');

              // Show submission start notification
              showAssessmentSubmissionStart();

              // Mark recent submission
              markRecentSubmission(answers);

              console.log('AssessmentHeader: Calling submitAssessmentFlexible API...');
              return await submitAssessmentFlexible(answers, user?.id, refreshTokenBalance);
            });

            const { resultId, personaTitle } = result;

            // Show success notification
            showAssessmentSubmissionResult(true, `Partial assessment completed successfully! Persona: ${personaTitle}`);

            // Add assessment to dashboard history with duplicate prevention
            addToAssessmentHistory({
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
            });

            // Navigate to results page with enhanced debugging
            const resultsUrl = `/results/${resultId}`;
            console.log('AssessmentHeader: Navigating to results page (flexible):', resultsUrl);

            const navigationSuccess = await debugNavigate(router, resultsUrl, {
              source: 'assessment_completion',
              assessmentType: 'flexible',
              resultId
            });

            if (!navigationSuccess) {
              console.error('AssessmentHeader: All navigation methods failed (flexible)');
              alert('Tidak dapat membuka halaman hasil. Silakan refresh halaman dan coba lagi.');
            }
            return;
          } catch (error) {
            console.error('Error submitting partial assessment:', error);

            // Use the enhanced token error handling
            const errorMessage = getTokenBalanceErrorMessage(error);

            if (error.message?.includes('50%')) {
              showAssessmentSubmissionResult(false, 'Tidak dapat submit assessment. Perlu menyelesaikan minimal 50% pertanyaan.');
            } else {
              showAssessmentSubmissionResult(false, errorMessage);
            }
          }
        }

        // Save progress and go to dashboard
        addToAssessmentHistory({
          id: Date.now(),
          nama: "Assessment Belum Selesai",
          tipe: "Personality Assessment",
          tanggal: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          status: "Belum Selesai",
          resultId: null
        });

        // Also save current progress
        localStorage.setItem('assessment-progress', JSON.stringify(answers));

        // Navigate to dashboard with enhanced debugging
        console.log('AssessmentHeader: Navigating to dashboard (progress saved)');

        const navigationSuccess = await debugNavigate(router, '/dashboard', {
          source: 'assessment_save_progress',
          reason: 'incomplete_assessment'
        });

        if (!navigationSuccess) {
          console.error('AssessmentHeader: Dashboard navigation failed');
          alert('Tidak dapat kembali ke dashboard. Silakan refresh halaman.');
        }
      }
    } catch (error) {
      console.error('Error saving assessment:', error);

      // Use enhanced error handling for token-related issues
      const errorMessage = getTokenBalanceErrorMessage(error);
      showTokenError(errorMessage, 'Please try again or contact support if the problem persists.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 lg:px-8 py-4 lg:py-6 bg-transparent gap-4 sm:gap-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#64707D] text-sm lg:text-[16px] font-medium shadow-sm hover:bg-[#f5f7fb] transition"
          type="button"
        >
          <img src="/icons/CaretLeft.svg" alt="Back" className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </button>
        <span className="font-semibold text-base lg:text-lg sm:ml-4 mt-2 sm:mt-0">{phase}: {assessmentName}</span>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 w-full sm:w-auto">
        {/* Debug Buttons - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <button
              onClick={handleDebugFillCurrent}
              className="px-2 sm:px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition"
              title="Debug: Isi assessment saat ini"
            >
              <span className="hidden sm:inline">🐛 Fill Current</span>
              <span className="sm:hidden">🐛 Current</span>
            </button>
            <button
              onClick={handleDebugFillAll}
              className="px-2 sm:px-3 py-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition"
              title="Debug: Isi semua assessment"
            >
              <span className="hidden sm:inline">🐛 Fill All</span>
              <span className="sm:hidden">🐛 All</span>
            </button>
            <button
              onClick={handleDebugFinishAssessment}
              className="px-2 sm:px-3 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition"
              title="Debug: Selesaikan assessment dan ke results"
            >
              <span className="hidden sm:inline">🐛 Finish & Go to Results</span>
              <span className="sm:hidden">🐛 Finish</span>
            </button>
          </div>
        )}

        <button
          onClick={handleSaveAndExit}
          disabled={isSaving}
          className="text-[#6475e9] text-sm font-semibold hover:text-[#5a6bd8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan & Keluar'}
        </button>
      </div>
    </div>
  );
}
