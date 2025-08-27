'use client';

import { assessmentTypes, bigFiveQuestions, riasecQuestions, viaQuestions } from '../../data/assessmentQuestions';

export default function AllQuestionsDisplay() {
  const renderQuestionCard = (question: any, assessmentName: string, questionNumber: number) => {
    return (
      <div key={`${assessmentName}-${question.id}`} className="bg-white rounded-xl shadow p-8 w-[1200px] h-[450px] mx-auto flex flex-col gap-4 mb-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="inline-block px-4 py-2 rounded-full bg-[#e7eaff] text-[#6475e9] text-sm font-semibold">
              {assessmentName}
            </span>
            <span className="text-sm text-[#64707d] font-medium">
              Soal #{questionNumber}
            </span>
          </div>
          <div className="mb-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#f0f9ff] text-[#0369a1] text-xs font-medium mb-2">
              {question.subcategory || question.category}
            </span>
            {question.isReversed && (
              <span className="inline-block px-3 py-1 rounded-full bg-[#fef3c7] text-[#d97706] text-xs font-medium mb-2 ml-2">
                Reverse Scored
              </span>
            )}
          </div>
          <h3 className="font-bold text-xl mb-3 leading-relaxed">{question.text}</h3>
        </div>

        {/* Scale Display */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[#64707d] text-base mb-6 text-center">
            Skala Penilaian: 1 (Sangat Tidak Setuju) - 5 (Sangat Setuju)
          </p>
          <div className="flex justify-between items-center gap-2 px-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-[#e5e7eb] flex items-center justify-center mb-2">
                  <span className="text-lg font-semibold text-[#64707d]">{value}</span>
                </div>
                <span className="text-xs text-[#64707d] text-center">
                  {value === 1 && "Sangat Tidak Setuju"}
                  {value === 2 && "Tidak Setuju"}
                  {value === 3 && "Netral"}
                  {value === 4 && "Setuju"}
                  {value === 5 && "Sangat Setuju"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-[#eaecf0] pt-4 mt-4">
          <div className="flex justify-between items-center text-sm text-[#64707d]">
            <span>Kategori: {question.category}</span>
            <span>ID: {question.id}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 text-[#1e1e1e]">
          Semua Soal Assessment
        </h1>

        {/* Big Five Questions */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#6475e9] mb-4">
              Big Five Personality Assessment
            </h2>
            <p className="text-[#64707d] text-lg">
              44 Soal untuk mengukur 5 dimensi kepribadian utama
            </p>
          </div>
          {bigFiveQuestions.map((question, index) => 
            renderQuestionCard(question, "Big Five Personality", index + 1)
          )}
        </section>

        {/* RIASEC Questions */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#6475e9] mb-4">
              RIASEC Holland Codes Assessment
            </h2>
            <p className="text-[#64707d] text-lg">
              60 Soal untuk mengidentifikasi minat dan bakat karir
            </p>
          </div>
          {riasecQuestions.map((question, index) => 
            renderQuestionCard(question, "RIASEC Holland Codes", index + 1)
          )}
        </section>

        {/* VIA Character Strengths Questions */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#6475e9] mb-4">
              VIA Character Strengths Assessment
            </h2>
            <p className="text-[#64707d] text-lg">
              96 Soal untuk mengukur kekuatan karakter (menampilkan 48 soal pertama)
            </p>
          </div>
          {viaQuestions.map((question, index) => 
            renderQuestionCard(question, "VIA Character Strengths", index + 1)
          )}
        </section>

        {/* Summary Statistics */}
        <section className="bg-white rounded-xl shadow p-8 w-[1200px] mx-auto">
          <h3 className="text-2xl font-bold text-center mb-6">Ringkasan Assessment</h3>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#6475e9] mb-2">44</div>
              <div className="text-[#64707d]">Soal Big Five</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#6475e9] mb-2">60</div>
              <div className="text-[#64707d]">Soal RIASEC</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#6475e9] mb-2">96</div>
              <div className="text-[#64707d]">Soal VIA Character</div>
            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-[#eaecf0]">
            <div className="text-5xl font-bold text-[#6475e9] mb-2">200</div>
            <div className="text-[#64707d] text-lg">Total Soal Assessment</div>
          </div>
        </section>
      </div>
    </div>
  );
}
