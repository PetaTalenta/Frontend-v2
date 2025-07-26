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
    <div className={`bg-white rounded-xl shadow p-10 w-[1400px] mx-auto flex flex-col gap-8 mb-8 ${
      navigationButtons ? 'h-[520px]' : 'h-[390px]'
    }`}>
      {/* Top badge and question */}
      <div className="mb-2">
        <span className="inline-block px-4 py-1 rounded-full bg-[#e7eaff] text-[#6475e9] text-s font-semibold mb-6">
          {question.subcategory}
        </span>
        <h3 className="font-bold text-2xl mb-2 mt-2 text-[#313131]">{question.text}</h3>
        <p className="text-[#64707d] text-base mb-4">
          Pilih seberapa setuju Anda dengan pernyataan di atas menggunakan skala 1-{scaleConfig.values.length}
        </p>
      </div>
      {/* Radio scale */}
      <div className="flex flex-row items-end justify-between gap-4 mb-2 px-4">
        {scaleConfig.values.map((value: number, idx: number) => (
          <div key={value} className="flex flex-col items-center w-44">
            <span className={`text-xs font-medium mb-1 text-[${scaleConfig.colors[idx]}]`}>
              {scaleLabels[idx]}
            </span>
            <span className={`text-xl font-bold text-[${scaleConfig.colors[idx]}]`}>{value}</span>
            <input
              type="radio"
              name={`answer-${question.id}`}
              value={value}
              checked={selectedAnswer === value}
              onChange={() => onAnswer && onAnswer(value)}
              className="mt-2 w-6 h-6 accent-[#6475e9]"
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
