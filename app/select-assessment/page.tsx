"use client"

// Images are in public/card/ and public/icons/
// Tailwind is used for styling

import { useRouter } from "next/navigation";
const imgVIA = "/card/VIA-IS.png";
const imgRIASEC = "/card/RIASEC.png";
const imgOCEAN = "/card/OCEAN.png";
const upperRightIcon = "/icons/upper-right.svg";

export default function SelectAssessmentPage() {
  const router = useRouter();
  return (
    <div className="bg-[#f5f7fb] flex flex-col items-center justify-center px-[90px] py-[62px] min-h-screen w-full relative">
      {/* Back Button */}
      <div className="absolute left-8 top-8">
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#64707D] text-[18px] font-medium shadow-sm hover:bg-[#f5f7fb] transition"
          type="button"
          onClick={() => window.history.back()}
        >
          <img src="/icons/CaretLeft.svg" alt="Back" className="w-5 h-5" />
          Kembali
        </button>
      </div>
      {/* Header */}
      <div className="flex flex-col gap-1 items-center w-full text-center mb-28">
        <div className="font-bold text-[#40474F] text-[64px] tracking-[-1.5px] leading-[1.4] font-['Plus Jakarta Sans',sans-serif]">
          Kenali Dirimu, Maksimalkan Potensimu
        </div>
        <div className="font-normal text-[#64707D] text-[20px] tracking-[-0.25px] leading-[1.6] font-['Plus Jakarta Sans',sans-serif]">
          Temukan kekuatan karakter, minat karier, dan kepribadianmu melalui tiga tes psikologi terbaik.
        </div>
      </div>
      <div className="flex flex-col gap-8 items-center w-3/5">
        {/* Cards & Button Mulai Tes */}
        <div className="flex flex-col items-center w-full gap-4">
          <div className="flex flex-row items-start justify-center gap-20 w-full max-w-[1232px]">
            {/* VIA-IS Card */}
            <div className="relative bg-[#6475e9] rounded-[24px] w-[444px] h-[480px] flex flex-col items-center shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
              <img src={upperRightIcon} alt="Go" className="absolute right-4 top-4 w-8 h-8 bg-white rounded-full p-2 shadow z-10" />
              <div className="flex flex-col items-center mt-12 mb-2">
                <div className="font-bold text-white text-[36px] leading-tight tracking-tight font-['Plus Jakarta Sans',sans-serif]">VIA-IS</div>
                <div className="font-normal text-white text-[16px] mt-1 font-['Plus Jakarta Sans',sans-serif]">Temukan kekuatan karaktermu.</div>
              </div>
              <div className="flex-1 flex items-end w-full justify-center pb-0 relative z-10">
                <img src={imgVIA} alt="VIA-IS" className="w-[300px] h-[300px] object-contain" />
              </div>
              <div className="absolute left-0 bottom-0 w-full h-[120px] rounded-b-[24px] bg-[#bfc8f7] z-0" style={{clipPath:'ellipse(90% 60% at 50% 100%)'}} />
            </div>
            {/* RIASEC Card */}
            <div className="relative bg-[#6475e9] rounded-[24px] w-[444px] h-[480px] flex flex-col items-center shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
              <img src={upperRightIcon} alt="Go" className="absolute right-4 top-4 w-8 h-8 bg-white rounded-full p-2 shadow z-10" />
              <div className="flex flex-col items-center mt-12 mb-2">
                <div className="font-bold text-white text-[36px] leading-tight tracking-tight font-['Plus Jakarta Sans',sans-serif]">RIASEC</div>
                <div className="font-normal text-white text-[16px] mt-1 font-['Plus Jakarta Sans',sans-serif]">Kenali bakat dan minat karirmu.</div>
              </div>
              <div className="flex-1 flex items-end w-full justify-center pb-0 relative z-10">
                <img src={imgRIASEC} alt="RIASEC" className="w-[300px] h-[300px] object-contain" />
              </div>
              <div className="absolute left-0 bottom-0 w-full h-[120px] rounded-b-[24px] bg-[#bfc8f7] z-0" style={{clipPath:'ellipse(90% 60% at 50% 100%)'}} />
            </div>
            {/* OCEAN Card */}
            <div className="relative bg-[#6475e9] rounded-[24px] w-[444px] h-[480px] flex flex-col items-center shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
              <img src={upperRightIcon} alt="Go" className="absolute right-4 top-4 w-8 h-8 bg-white rounded-full p-2 shadow z-10" />
              <div className="flex flex-col items-center mt-12 mb-2">
                <div className="font-bold text-white text-[36px] leading-tight tracking-tight font-['Plus Jakarta Sans',sans-serif]">OCEAN</div>
                <div className="font-normal text-white text-[16px] mt-1 font-['Plus Jakarta Sans',sans-serif] text-center">Pahami kepribadianmu secara mendalam.</div>
              </div>
              <div className="flex-1 flex items-end w-full justify-center pb-0 relative z-10">
                <img src={imgOCEAN} alt="OCEAN" className="w-[300px] h-[300px] object-contain" />
              </div>
              <div className="absolute left-0 bottom-0 w-full h-[120px] rounded-b-[24px] bg-[#bfc8f7] z-0" style={{clipPath:'ellipse(90% 60% at 50% 100%)'}} />
            </div>
          </div>
          {/* Button Mulai Tes */}
          <div className="flex flex-col items-center w-full mt-8">
            <button
              className="flex items-center justify-center gap-2 border border-[#6475E9] rounded-[12px] bg-white text-[#6475E9] text-[16px] font-semibold transition hover:bg-[#f2f4ff] focus:outline-none focus:ring-2 focus:ring-[#6475E9] focus:ring-offset-2"
              style={{ width: 320, height: 48 }}
              type="button"
              onClick={() => router.push("/assessment")}
            >
              Mulai Tes
              <img src="/icons/Chevron right.svg" alt="Chevron Right" className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
        {/* Hint */}
        <div className="flex flex-row items-upper justify-center w-full rounded-3xl mt-6">
          <div className="font-bold text-[#2d3339] text-[18px] mr-2">Hint:</div>
          <div className="font-normal text-[#64707d] text-[18px] text-justify">Kamu akan mengikuti 200 pertanyaan gabungan dari VIA-IS, OCEAN, dan RIASEC. Jawab dengan jujur dan santai—setiap jawaban akan membantumu menemukan kekuatan, kepribadian, dan minat terbaikmu. Yuk mulai perjalanan pengembangan dirimu sekarang!</div>
        </div>
      </div>
    </div>
  );
}
