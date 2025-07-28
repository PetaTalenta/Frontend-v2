"use client";

import React, { useState } from "react";

export default function AssessmentQuestionCard({
  question,
  scaleConfig,
  scaleLabels,
  selectedAnswer,
  onAnswer,
  isLastQuestion = false,
  navigationButtons
}: {
  question: any,
  scaleConfig: any,
  scaleLabels: string[],
  selectedAnswer?: number | null,
  onAnswer?: (value: number) => void,
  isLastQuestion?: boolean,
  navigationButtons?: React.ReactNode,
}) {
  return (
    <div className={`bg-white rounded-xl shadow p-4 sm:p-6 lg:p-10 w-full max-w-[1400px] mx-auto flex flex-col gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8 ${
      navigationButtons ? 'min-h-[400px] sm:min-h-[460px] lg:min-h-[520px]' : 'min-h-[300px] sm:min-h-[340px] lg:min-h-[390px]'
    }`}>
      {/* Top badge and question */}
      <div className="mb-2">
        <span className="inline-block px-3 sm:px-4 py-1 rounded-full bg-[#e7eaff] text-[#6475e9] text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
          {question.subcategory}
        </span>
        <h3 className="font-bold text-lg sm:text-xl lg:text-2xl mb-2 mt-2 text-[#313131] leading-tight">{question.text}</h3>
        <p className="text-[#64707d] text-sm sm:text-base mb-4">
          Pilih seberapa setuju Anda dengan pernyataan di atas menggunakan skala 1-{scaleConfig.values.length}
        </p>
      </div>
      {/* Radio scale */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-2 sm:gap-4 mb-2 px-2 sm:px-4">
        {scaleConfig.values.map((value: number, idx: number) => (
          <div key={value} className="flex flex-col items-center w-full sm:w-auto sm:flex-1 max-w-[120px] sm:max-w-[180px]">
            <span className={`text-xs sm:text-sm font-medium mb-1 text-center text-[${scaleConfig.colors[idx]}] leading-tight`}>
              {scaleLabels[idx]}
            </span>
            <span className={`text-lg sm:text-xl font-bold text-[${scaleConfig.colors[idx]}]`}>{value}</span>
            <input
              type="radio"
              name={`answer-${question.id}`}
              value={value}
              checked={selectedAnswer === value}
              onChange={() => onAnswer && onAnswer(value)}
              className="mt-2 w-5 h-5 sm:w-6 sm:h-6 accent-[#6475e9]"
            />
          </div>
        ))}
      </div>
      {/* Divider - only show for last question */}
      {navigationButtons && (
        <div className="border-t border-[#eaecf0] my-4" />
      )}

      {/* Navigation buttons - only show for last question */}
      {navigationButtons && (
        <div className="mt-auto">
          {navigationButtons}
        </div>
      )}
    </div>
  );
}
