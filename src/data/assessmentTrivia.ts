// Lightweight trivia dataset and helpers for AssessmentLoadingPage
// Provides getTriviaForStage and getRandomTrivia used by the UI

export type TriviaStage = 'processing' | 'analyzing' | 'preparing';

export interface TriviaItem {
  id: string;
  title: string;
  content: string;
  category:
    | 'history'
    | 'theory'
    | 'concept'
    | 'statistics'
    | 'application'
    | 'objectivity'
    | 'learning'
    | 'success'
    | 'culture'
    | 'development';
  stage: TriviaStage;
}

// Small, static set of trivia items (kept tiny to avoid bundle bloat)
const TRIVIA: TriviaItem[] = [
  // processing (generic waiting stage)
  {
    id: 'p1',
    title: 'AI mempercepat analisis',
    content:
      'Pipeline kami menormalisasi jawaban dan menghitung beberapa skala (RIASEC, Big Five, VIA) sebelum dikirim ke mesin analisis.',
    category: 'concept',
    stage: 'processing',
  },
  {
    id: 'p2',
    title: 'Antrian pintar',
    content:
      'Saat server sibuk, permintaan Anda masuk ke antrian dengan estimasi waktu yang terus diperbarui.',
    category: 'statistics',
    stage: 'processing',
  },
  {
    id: 'p3',
    title: 'Objektivitas hasil',
    content:
      'Sistem dirancang untuk meminimalkan bias dengan aturan skoring yang konsisten dan validasi berlapis.',
    category: 'objectivity',
    stage: 'processing',
  },

  // analyzing (AI crunching)
  {
    id: 'a1',
    title: 'Model memadukan beberapa dimensi',
    content:
      'Selama analisis, beberapa dimensi kepribadian digabung untuk menemukan pola kecenderungan yang lebih stabil.',
    category: 'theory',
    stage: 'analyzing',
  },
  {
    id: 'a2',
    title: 'Fokus pada sinyal utama',
    content:
      'Algoritma memprioritaskan indikator dengan reliabilitas tertinggi agar rekomendasi tetap relevan.',
    category: 'application',
    stage: 'analyzing',
  },
  {
    id: 'a3',
    title: 'Data tetap privat',
    content:
      'Analisis dijalankan secara terotentikasi; hanya hasil akhir yang disimpan untuk ditampilkan kembali.',
    category: 'success',
    stage: 'analyzing',
  },

  // preparing (result composing)
  {
    id: 'g1',
    title: 'Menyusun laporan personal',
    content:
      'Sistem merangkai insight, kekuatan utama, dan saran pengembangan ke dalam laporan yang mudah dipahami.',
    category: 'learning',
    stage: 'preparing',
  },
  {
    id: 'g2',
    title: 'Bahasa yang lebih natural',
    content:
      'Template output dioptimalkan agar narasi terasa natural dan tidak terlalu teknis.',
    category: 'culture',
    stage: 'preparing',
  },
  {
    id: 'g3',
    title: 'Rekomendasi pengembangan',
    content:
      'Laporan menyertakan langkah kecil yang bisa langsung dicoba untuk mendukung pertumbuhan Anda.',
    category: 'development',
    stage: 'preparing',
  },
];

const byStage: Record<TriviaStage, TriviaItem[]> = {
  processing: TRIVIA.filter((t) => t.stage === 'processing'),
  analyzing: TRIVIA.filter((t) => t.stage === 'analyzing'),
  preparing: TRIVIA.filter((t) => t.stage === 'preparing'),
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getTriviaForStage(stage: TriviaStage): TriviaItem {
  const list = byStage[stage] && byStage[stage].length > 0 ? byStage[stage] : TRIVIA;
  return pickRandom(list);
}

export function getRandomTrivia(): TriviaItem {
  return pickRandom(TRIVIA);
}

