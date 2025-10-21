"use client"

// Images are in public/card/ and public/icons/
// Tailwind is used for styling

import { useRouter } from "next/navigation";
import Image from "next/image";

// Preload critical images
const imgVIA = "/card/VIA-IS.png";
const imgRIASEC = "/card/RIASEC.png";
const imgOCEAN = "/card/OCEAN.png";
const upperRightIcon = "/icons/upper-right.svg";

export default function SelectAssessmentPage() {
  const router = useRouter();
  return (
    <div className="bg-[#f5f7fb] flex flex-col items-center justify-center px-4 sm:px-8 lg:px-[90px] py-8 sm:py-12 lg:py-[62px] 2xl:py-8 h-screen overflow-hidden w-full relative">
      {/* Back Button */}
      <div className="absolute left-4 sm:left-8 top-4 sm:top-8 z-10">
        <button
          className="flex items-center gap-2 px-3 sm:px-5 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#64707D] text-sm sm:text-[18px] font-medium shadow-sm hover:bg-[#f5f7fb] transition"
          type="button"
          onClick={() => window.history.back()}
        >
          <img src="/icons/CaretLeft.svg" alt="Back" className="w-4 h-4 sm:w-5 sm:h-5" />
          Kembali
        </button>
      </div>
      {/* Header */}
      <div className="flex flex-col gap-1 items-center w-full text-center mb-12 sm:mb-20 lg:mb-24 2xl:mb-16 px-4 pt-16 sm:pt-20 md:pt-8 2xl:pt-4">
        <div className="font-bold text-[#40474F] text-2xl sm:text-4xl lg:text-[64px] 2xl:text-[56px] tracking-[-1.5px] leading-[1.4] 2xl:leading-[1.2] font-['Plus Jakarta Sans',sans-serif] mb-4">
          Kenali Dirimu, Maksimalkan Potensimu
        </div>
        <div className="font-normal text-[#64707D] text-sm sm:text-lg lg:text-[20px] 2xl:text-[18px] tracking-[-0.25px] leading-[1.6] 2xl:leading-[1.5] font-['Plus Jakarta Sans',sans-serif] max-w-4xl">
          Temukan kekuatan karakter, minat karier, dan kepribadianmu melalui tiga tes psikologi terbaik.
        </div>
      </div>
      <div className="flex flex-col gap-6 sm:gap-8 items-center w-full max-w-7xl px-4">
        {/* Cards & Button Mulai Tes */}
        <div className="flex flex-col items-center w-full gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 xl:gap-20 w-full justify-items-center">
            {/* VIA-IS Card */}
            <div className="relative bg-[#6475e9] rounded-[24px] w-full max-w-[400px] lg:max-w-[444px] h-[400px] sm:h-[450px] lg:h-[480px] 2xl:h-[420px] flex flex-col items-center shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
              <Image
                src={upperRightIcon}
                alt="Go"
                width={32}
                height={32}
                className="absolute right-4 top-4 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full p-1.5 sm:p-2 shadow z-10"
              />
              <div className="flex flex-col items-center mt-8 sm:mt-12 mb-2">
                <div className="font-bold text-white text-2xl sm:text-3xl lg:text-[36px] leading-tight tracking-tight font-['Plus Jakarta Sans',sans-serif]">VIA-IS</div>
                <div className="font-normal text-white text-sm sm:text-[16px] mt-1 font-['Plus Jakarta Sans',sans-serif] text-center px-4">Temukan kekuatan karaktermu.</div>
              </div>
              <div className="flex-1 flex items-end w-full justify-center pb-0 relative z-10">
                <Image
                  src={imgVIA}
                  alt="VIA-IS Assessment"
                  width={300}
                  height={300}
                  priority
                  sizes="(max-width: 640px) 200px, (max-width: 1024px) 250px, 300px"
                  className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] lg:w-[300px] lg:h-[300px] 2xl:w-[280px] 2xl:h-[280px] object-contain"
                />
              </div>
              <div className="absolute left-0 bottom-0 w-full h-[80px] sm:h-[100px] lg:h-[120px] 2xl:h-[100px] rounded-b-[24px] bg-[#bfc8f7] z-0" style={{clipPath:'ellipse(90% 60% at 50% 100%)'}} />
            </div>
            {/* RIASEC Card */}
            <div className="relative bg-[#6475e9] rounded-[24px] w-full max-w-[400px] lg:max-w-[444px] h-[400px] sm:h-[450px] lg:h-[480px] 2xl:h-[420px] flex flex-col items-center shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer hidden md:flex">
              <img src={upperRightIcon} alt="Go" className="absolute right-4 top-4 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full p-1.5 sm:p-2 shadow z-10" />
              <div className="flex flex-col items-center mt-8 sm:mt-12 mb-2">
                <div className="font-bold text-white text-2xl sm:text-3xl lg:text-[36px] leading-tight tracking-tight font-['Plus Jakarta Sans',sans-serif]">RIASEC</div>
                <div className="font-normal text-white text-sm sm:text-[16px] mt-1 font-['Plus Jakarta Sans',sans-serif] text-center px-4">Kenali bakat dan minat karirmu.</div>
              </div>
              <div className="flex-1 flex items-end w-full justify-center pb-0 relative z-10">
                <img src={imgRIASEC} alt="RIASEC" className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] lg:w-[300px] lg:h-[300px] 2xl:w-[280px] 2xl:h-[280px] object-contain" />
              </div>
              <div className="absolute left-0 bottom-0 w-full h-[80px] sm:h-[100px] lg:h-[120px] 2xl:h-[100px] rounded-b-[24px] bg-[#bfc8f7] z-0" style={{clipPath:'ellipse(90% 60% at 50% 100%)'}} />
            </div>
            {/* OCEAN Card */}
            <div className="relative bg-[#6475e9] rounded-[24px] w-full max-w-[400px] lg:max-w-[444px] h-[400px] sm:h-[450px] lg:h-[480px] 2xl:h-[420px] flex flex-col items-center shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer lg:col-span-1 hidden md:flex">
              <img src={upperRightIcon} alt="Go" className="absolute right-4 top-4 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full p-1.5 sm:p-2 shadow z-10" />
              <div className="flex flex-col items-center mt-8 sm:mt-12 mb-2">
                <div className="font-bold text-white text-2xl sm:text-3xl lg:text-[36px] leading-tight tracking-tight font-['Plus Jakarta Sans',sans-serif]">OCEAN</div>
                <div className="font-normal text-white text-sm sm:text-[16px] mt-1 font-['Plus Jakarta Sans',sans-serif] text-center px-4">Pahami kepribadianmu secara mendalam.</div>
              </div>
              <div className="flex-1 flex items-end w-full justify-center pb-0 relative z-10">
                <img src={imgOCEAN} alt="OCEAN" className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] lg:w-[300px] lg:h-[300px] 2xl:w-[280px] 2xl:h-[280px] object-contain" />
              </div>
              <div className="absolute left-0 bottom-0 w-full h-[80px] sm:h-[100px] lg:h-[120px] 2xl:h-[100px] rounded-b-[24px] bg-[#bfc8f7] z-0" style={{clipPath:'ellipse(90% 60% at 50% 100%)'}} />
            </div>
          </div>
          {/* Button Mulai Tes */}
          <div className="flex flex-col items-center w-full mt-6 sm:mt-8 2xl:mt-4">
            <button
              className="flex items-center justify-center gap-2 border border-[#6475E9] rounded-[12px] bg-white text-[#6475E9] text-sm sm:text-[16px] font-semibold transition hover:bg-[#f2f4ff] focus:outline-none focus:ring-2 focus:ring-[#6475E9] focus:ring-offset-2 w-full max-w-[320px] h-12 sm:h-[48px] px-6"
              type="button"
              onClick={() => router.push("/assessment")}
            >
              Mulai Tes
              <img src="/icons/Chevron right.svg" alt="Chevron Right" className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
            </button>
          </div>
        </div>
        {/* Hint */}
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-top w-full rounded-3xl mt-6 2xl:mt-4 px-4">
          <div className="font-bold text-[#2d3339] text-base sm:text-[18px] 2xl:text-[16px] mb-2 sm:mb-0 sm:mr-2 flex-shrink-0">Hint:</div>
          <div className="font-normal text-[#64707d] text-sm sm:text-[18px] 2xl:text-[16px] text-left sm:text-justify leading-relaxed 2xl:leading-normal">Kamu akan mengikuti 200 pertanyaan gabungan dari VIA-IS, OCEAN, dan RIASEC. Jawab dengan jujur dan santai—setiap jawaban akan membantumu menemukan kekuatan, kepribadian, dan minat terbaikmu. Yuk mulai perjalanan pengembangan dirimu sekarang!</div>
        </div>
      </div>
    </div>
  );
}
