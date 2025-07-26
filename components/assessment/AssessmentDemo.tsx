'use client';

import { useState } from 'react';
import { assessmentTypes, bigFiveQuestions, riasecQuestions, viaQuestions } from '../../data/assessmentQuestions';

export default function AssessmentDemo() {
  const [selectedAssessment, setSelectedAssessment] = useState('big-five');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const getQuestionsForAssessment = (assessmentId: string) => {
    switch (assessmentId) {
      case 'big-five':
        return bigFiveQuestions;
      case 'riasec':
        return riasecQuestions;
      case 'via-character':
        return viaQuestions;
      default:
        return bigFiveQuestions;
    }
  };

  const currentAssessment = assessmentTypes.find(a => a.id === selectedAssessment);
  const questions = getQuestionsForAssessment(selectedAssessment);
  const currentQuestion = questions[currentQuestionIndex];

  const handleAssessmentChange = (assessmentId: string) => {
    setSelectedAssessment(assessmentId);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
    }
  };

  if (!currentAssessment || !currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Assessment Demo</h1>
        
        {/* Assessment Selector */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pilih Jenis Assessment:</h2>
          <div className="flex gap-4">
            {assessmentTypes.map((assessment) => (
              <button
                key={assessment.id}
                onClick={() => handleAssessmentChange(assessment.id)}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  selectedAssessment === assessment.id
                    ? 'bg-[#6475e9] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {assessment.name}
              </button>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow p-8 mb-8">
          <div className="mb-6">
            <span className="inline-block px-4 py-1 rounded-full bg-[#e7eaff] text-[#6475e9] text-sm font-semibold mb-4">
              {currentQuestion.subcategory}
            </span>
            <h3 className="font-bold text-2xl mb-4">{currentQuestion.text}</h3>
            <p className="text-[#64707d] text-base mb-6">
              Pilih seberapa setuju Anda dengan pernyataan di atas menggunakan skala 1-{currentAssessment.scaleLabels.length}
            </p>
          </div>

          {/* Scale Options */}
          <div className="flex justify-between gap-2 mb-8">
            {currentAssessment.scaleLabels.map((label, index) => {
              const value = index + 1;
              const isSelected = selectedAnswer === value;
              return (
                <div key={value} className="flex flex-col items-center flex-1">
                  <span className="text-xs font-medium mb-2 text-center h-8 flex items-center">
                    {label}
                  </span>
                  <span className="text-xl font-bold mb-2">{value}</span>
                  <button
                    onClick={() => setSelectedAnswer(value)}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      isSelected
                        ? 'bg-[#6475e9] border-[#6475e9]'
                        : 'border-gray-300 hover:border-[#6475e9]'
                    }`}
                  >
                    {isSelected && <div className="w-4 h-4 bg-white rounded-full mx-auto" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#6475e9] text-white hover:bg-[#5a6fd8]'
              }`}
            >
              ← Sebelumnya
            </button>

            <span className="text-sm text-[#64707d]">
              Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                currentQuestionIndex === questions.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#6475e9] text-white hover:bg-[#5a6fd8]'
              }`}
            >
              Selanjutnya →
            </button>
          </div>
        </div>

        {/* Assessment Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2">{currentAssessment.name}</h3>
          <p className="text-[#64707d] mb-4">{currentAssessment.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Pertanyaan:</span> {currentAssessment.totalQuestions}
            </div>
            <div>
              <span className="font-medium">Tipe Skala:</span> {currentAssessment.scaleType}
            </div>
            <div>
              <span className="font-medium">Kategori:</span> {currentQuestion.category}
            </div>
            <div>
              <span className="font-medium">Sub-kategori:</span> {currentQuestion.subcategory}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
