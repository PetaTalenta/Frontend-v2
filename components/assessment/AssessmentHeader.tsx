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
import { validateTokensForAssessment, getTokenBalanceErrorMessage } from '../../utils/token-balance';
import {
  showInsufficientTokensWarning,
  showAssessmentSubmissionStart,
  showAssessmentSubmissionResult,
  showTokenError
} from '../../utils/token-notifications';

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
            alert('Debug Error: Insufficient token balance. You need at least 2 tokens to submit an assessment.');
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
        // Check token balance before submission
        console.log('AssessmentHeader: Validating token balance...');
        const tokenValidation = await validateTokensForAssessment();

        if (!tokenValidation.canSubmit) {
          showInsufficientTokensWarning(tokenValidation.tokenInfo.balance, 2);
          setIsSaving(false);
          return;
        }

        console.log('AssessmentHeader: Token validation passed, submitting assessment...');

        // Show submission start notification
        showAssessmentSubmissionStart();

        // All questions answered - submit assessment and go to results
        const { resultId, personaTitle } = await submitAssessment(answers, user?.id, refreshTokenBalance);

        // Show success notification
        showAssessmentSubmissionResult(true, `Assessment completed successfully! Persona: ${personaTitle}`);

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
            // Check token balance before submission
            console.log('AssessmentHeader: Validating token balance for flexible submission...');
            const tokenValidation = await validateTokensForAssessment();

            if (!tokenValidation.canSubmit) {
              showInsufficientTokensWarning(tokenValidation.tokenInfo.balance, 2);
              setIsSaving(false);
              return;
            }

            console.log('AssessmentHeader: Token validation passed, submitting flexible assessment...');

            // Show submission start notification
            showAssessmentSubmissionStart();

            const { resultId, personaTitle } = await submitAssessmentFlexible(answers, user?.id, refreshTokenBalance);

            // Show success notification
            showAssessmentSubmissionResult(true, `Partial assessment completed successfully! Persona: ${personaTitle}`);

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
        const assessmentHistoryItem = {
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
        };

        // Save to localStorage for dashboard history
        const existingHistory = JSON.parse(localStorage.getItem('assessment-history') || '[]');
        existingHistory.unshift(assessmentHistoryItem);
        localStorage.setItem('assessment-history', JSON.stringify(existingHistory));

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
    <div className="flex items-center justify-between px-8 py-6 bg-transparent">
      <div className="flex items-center gap-2">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#64707D] text-[16px] font-medium shadow-sm hover:bg-[#f5f7fb] transition"
          type="button"
        >
          <img src="/icons/CaretLeft.svg" alt="Back" className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
        <span className="font-semibold text-lg ml-4">{phase}: {assessmentName}</span>
      </div>
      <div className="flex items-center gap-6">
        {/* Debug Buttons - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex gap-2">
            <button
              onClick={handleDebugFillCurrent}
              className="px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition"
              title="Debug: Isi assessment saat ini"
            >
              🐛 Fill Current
            </button>
            <button
              onClick={handleDebugFillAll}
              className="px-3 py-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition"
              title="Debug: Isi semua assessment"
            >
              🐛 Fill All
            </button>
            <button
              onClick={handleDebugFinishAssessment}
              className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition"
              title="Debug: Selesaikan assessment dan ke results"
            >
              🐛 Finish & Go to Results
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
