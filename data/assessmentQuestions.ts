// Assessment Questions Data
export interface Question {
  id: number;
  text: string;
  category: string;
  subcategory?: string;
  isReversed?: boolean;
}

export interface AssessmentType {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  scaleType: '5-point' | '7-point';
  scaleLabels: string[];
  questions: Question[];
}

// Big Five Personality Assessment (BFI-44)
export const bigFiveQuestions: Question[] = [
  // Keterbukaan terhadap Pengalaman (Openness to Experience)
  { id: 1, text: "Saya melihat diri saya sebagai seseorang yang orisinal dan suka menciptakan ide-ide baru.", category: "Openness to Experience", subcategory: "Openness to Experience" },
  { id: 2, text: "Saya melihat diri saya sebagai seseorang yang penasaran dengan banyak hal yang berbeda.", category: "Openness to Experience", subcategory: "Openness to Experience" },
  { id: 3, text: "Saya melihat diri saya sebagai seseorang yang cerdik dan suka berpikir mendalam.", category: "Openness to Experience", subcategory: "Openness to Experience" },
  { id: 4, text: "Saya melihat diri saya sebagai seseorang yang memiliki imajinasi yang aktif.", category: "Openness to Experience", subcategory: "Openness to Experience" },
  { id: 5, text: "Saya melihat diri saya sebagai seseorang yang inventif (suka menciptakan sesuatu).", category: "Openness to Experience", subcategory: "Openness to Experience" },
  { id: 6, text: "Saya melihat diri saya sebagai seseorang yang menghargai pengalaman artistik dan estetika.", category: "Openness to Experience", subcategory: "Openness to Experience" },
  { id: 7, text: "Saya melihat diri saya sebagai seseorang yang lebih suka pekerjaan yang rutin.", category: "Openness to Experience", subcategory: "Openness to Experience", isReversed: true },
  { id: 8, text: "Saya melihat diri saya sebagai seseorang yang suka merenungkan dan bermain dengan ide-ide.", category: "Openness to Experience", subcategory: "Openness to Experience" },
  { id: 9, text: "Saya melihat diri saya sebagai seseorang yang memiliki sedikit minat artistik.", category: "Openness to Experience", subcategory: "Openness to Experience", isReversed: true },
  { id: 10, text: "Saya melihat diri saya sebagai seseorang yang memiliki pemahaman mendalam tentang seni, musik, atau sastra.", category: "Openness to Experience", subcategory: "Openness to Experience" },

  // Kehati-hatian (Conscientiousness)
  { id: 11, text: "Saya melihat diri saya sebagai seseorang yang mengerjakan sesuatu dengan teliti.", category: "Conscientiousness", subcategory: "Conscientiousness" },
  { id: 12, text: "Saya melihat diri saya sebagai seseorang yang terkadang agak ceroboh.", category: "Conscientiousness", subcategory: "Conscientiousness", isReversed: true },
  { id: 13, text: "Saya melihat diri saya sebagai seseorang yang dapat diandalkan dalam bekerja.", category: "Conscientiousness", subcategory: "Conscientiousness" },
  { id: 14, text: "Saya melihat diri saya sebagai seseorang yang cenderung tidak teratur.", category: "Conscientiousness", subcategory: "Conscientiousness", isReversed: true },
  { id: 15, text: "Saya melihat diri saya sebagai seseorang yang cenderung malas.", category: "Conscientiousness", subcategory: "Conscientiousness", isReversed: true },
  { id: 16, text: "Saya melihat diri saya sebagai seseorang yang bertahan sampai tugas selesai.", category: "Conscientiousness", subcategory: "Conscientiousness" },
  { id: 17, text: "Saya melihat diri saya sebagai seseorang yang mengerjakan sesuatu dengan efisien.", category: "Conscientiousness", subcategory: "Conscientiousness" },
  { id: 18, text: "Saya melihat diri saya sebagai seseorang yang membuat rencana dan menjalankannya.", category: "Conscientiousness", subcategory: "Conscientiousness" },
  { id: 19, text: "Saya melihat diri saya sebagai seseorang yang mudah terganggu konsentrasinya.", category: "Conscientiousness", subcategory: "Conscientiousness", isReversed: true },

  // Ekstraversi (Extraversion)
  { id: 20, text: "Saya melihat diri saya sebagai seseorang yang suka berbicara.", category: "Extraversion", subcategory: "Extraversion" },
  { id: 21, text: "Saya melihat diri saya sebagai seseorang yang pendiam/tertutup.", category: "Extraversion", subcategory: "Extraversion", isReversed: true },
  { id: 22, text: "Saya melihat diri saya sebagai seseorang yang penuh energi.", category: "Extraversion", subcategory: "Extraversion" },
  { id: 23, text: "Saya melihat diri saya sebagai seseorang yang dapat membangkitkan antusiasme.", category: "Extraversion", subcategory: "Extraversion" },
  { id: 24, text: "Saya melihat diri saya sebagai seseorang yang cenderung pendiam.", category: "Extraversion", subcategory: "Extraversion", isReversed: true },
  { id: 25, text: "Saya melihat diri saya sebagai seseorang yang memiliki kepribadian tegas.", category: "Extraversion", subcategory: "Extraversion" },
  { id: 26, text: "Saya melihat diri saya sebagai seseorang yang terkadang pemalu dan terhambat.", category: "Extraversion", subcategory: "Extraversion", isReversed: true },
  { id: 27, text: "Saya melihat diri saya sebagai seseorang yang ramah dan mudah bergaul.", category: "Extraversion", subcategory: "Extraversion" },

  // Keramahan (Agreeableness)
  { id: 28, text: "Saya melihat diri saya sebagai seseorang yang cenderung mencari kesalahan orang lain.", category: "Agreeableness", subcategory: "Agreeableness", isReversed: true },
  { id: 29, text: "Saya melihat diri saya sebagai seseorang yang suka menolong dan tidak egois terhadap orang lain.", category: "Agreeableness", subcategory: "Agreeableness" },
  { id: 30, text: "Saya melihat diri saya sebagai seseorang yang suka memulai pertengkaran dengan orang lain.", category: "Agreeableness", subcategory: "Agreeableness", isReversed: true },
  { id: 31, text: "Saya melihat diri saya sebagai seseorang yang memiliki sifat pemaaf.", category: "Agreeableness", subcategory: "Agreeableness" },
  { id: 32, text: "Saya melihat diri saya sebagai seseorang yang umumnya mudah percaya.", category: "Agreeableness", subcategory: "Agreeableness" },
  { id: 33, text: "Saya melihat diri saya sebagai seseorang yang bisa bersikap dingin dan menjaga jarak.", category: "Agreeableness", subcategory: "Agreeableness", isReversed: true },
  { id: 34, text: "Saya melihat diri saya sebagai seseorang yang perhatian dan baik kepada hampir semua orang.", category: "Agreeableness", subcategory: "Agreeableness" },
  { id: 35, text: "Saya melihat diri saya sebagai seseorang yang terkadang kasar kepada orang lain.", category: "Agreeableness", subcategory: "Agreeableness", isReversed: true },
  { id: 36, text: "Saya melihat diri saya sebagai seseorang yang suka bekerja sama dengan orang lain.", category: "Agreeableness", subcategory: "Agreeableness" },

  // Neurotisisme (Neuroticism)
  { id: 37, text: "Saya melihat diri saya sebagai seseorang yang mudah depresi atau sedih.", category: "Neuroticism", subcategory: "Neuroticism" },
  { id: 38, text: "Saya melihat diri saya sebagai seseorang yang santai dan dapat mengatasi stres dengan baik.", category: "Neuroticism", subcategory: "Neuroticism", isReversed: true },
  { id: 39, text: "Saya melihat diri saya sebagai seseorang yang bisa tegang.", category: "Neuroticism", subcategory: "Neuroticism" },
  { id: 40, text: "Saya melihat diri saya sebagai seseorang yang sering khawatir.", category: "Neuroticism", subcategory: "Neuroticism" },
  { id: 41, text: "Saya melihat diri saya sebagai seseorang yang stabil secara emosional dan tidak mudah marah.", category: "Neuroticism", subcategory: "Neuroticism", isReversed: true },
  { id: 42, text: "Saya melihat diri saya sebagai seseorang yang bisa moody (mudah berubah suasana hati).", category: "Neuroticism", subcategory: "Neuroticism" },
  { id: 43, text: "Saya melihat diri saya sebagai seseorang yang tetap tenang dalam situasi tegang.", category: "Neuroticism", subcategory: "Neuroticism", isReversed: true },
  { id: 44, text: "Saya melihat diri saya sebagai seseorang yang mudah gugup.", category: "Neuroticism", subcategory: "Neuroticism" },
];

// RIASEC Holland Codes Questions
export const riasecQuestions: Question[] = [
  // Realistis (R) - "Para Pelaksana"
  { id: 101, text: "Saya senang bekerja dengan tangan, menggunakan alat, atau mengoperasikan mesin.", category: "Realistic", subcategory: "Realistic" },
  { id: 102, text: "Membangun, memperbaiki, atau memperbaiki sesuatu memberikan kepuasan bagi saya.", category: "Realistic", subcategory: "Realistic" },
  { id: 103, text: "Saya lebih suka bekerja di luar ruangan daripada di kantor.", category: "Realistic", subcategory: "Realistic" },
  { id: 104, text: "Saya adalah orang yang praktis dan suka melihat hasil nyata dari pekerjaan saya.", category: "Realistic", subcategory: "Realistic" },
  { id: 105, text: "Saya pandai dalam tugas-tugas mekanis dan memahami cara kerja sesuatu.", category: "Realistic", subcategory: "Realistic" },
  { id: 106, text: "Saya suka aktivitas seperti berkebun, konstruksi, atau mengerjakan mobil.", category: "Realistic", subcategory: "Realistic" },
  { id: 107, text: "Saya lebih suka masalah yang konkret daripada yang abstrak.", category: "Realistic", subcategory: "Realistic" },
  { id: 108, text: "Saya lebih suka bekerja dengan benda daripada dengan orang atau ide.", category: "Realistic", subcategory: "Realistic" },
  { id: 109, text: "Saya adalah orang yang suka petualangan dan menikmati tantangan fisik.", category: "Realistic", subcategory: "Realistic" },
  { id: 110, text: "Saya belajar paling baik dengan melakukan langsung.", category: "Realistic", subcategory: "Realistic" },

  // Investigatif (I) - "Para Pemikir"
  { id: 111, text: "Saya penasaran tentang dunia fisik dan alam.", category: "Investigative", subcategory: "Investigative" },
  { id: 112, text: "Saya senang memecahkan masalah kompleks yang membutuhkan banyak pemikiran.", category: "Investigative", subcategory: "Investigative" },
  { id: 113, text: "Saya suka melakukan penelitian, menganalisis data, dan memahami teori.", category: "Investigative", subcategory: "Investigative" },
  { id: 114, text: "Saya pandai dalam matematika dan sains.", category: "Investigative", subcategory: "Investigative" },
  { id: 115, text: "Saya senang melakukan aktivitas seperti membaca jurnal ilmiah, mengerjakan teka-teki, atau melakukan eksperimen.", category: "Investigative", subcategory: "Investigative" },
  { id: 116, text: "Saya adalah orang yang analitis dan logis.", category: "Investigative", subcategory: "Investigative" },
  { id: 117, text: "Saya lebih suka bekerja secara mandiri dan mengejar ide-ide saya sendiri.", category: "Investigative", subcategory: "Investigative" },
  { id: 118, text: "Saya menghargai ketepatan dan akurasi dalam pekerjaan saya.", category: "Investigative", subcategory: "Investigative" },
  { id: 119, text: "Saya lebih suka bekerja dengan ide daripada dengan orang atau benda.", category: "Investigative", subcategory: "Investigative" },
  { id: 120, text: "Saya terdorong untuk memahami mengapa sesuatu terjadi.", category: "Investigative", subcategory: "Investigative" },

  // Artistik (A) - "Para Pencipta"
  { id: 121, text: "Saya memiliki imajinasi yang baik dan senang mengekspresikan diri secara kreatif.", category: "Artistic", subcategory: "Artistic" },
  { id: 122, text: "Saya suka bekerja di lingkungan yang tidak terstruktur di mana saya bisa menjadi orisinal.", category: "Artistic", subcategory: "Artistic" },
  { id: 123, text: "Saya senang melakukan aktivitas seperti melukis, menulis, bermain musik, atau menari.", category: "Artistic", subcategory: "Artistic" },
  { id: 124, text: "Saya adalah orang yang ekspresif, orisinal, dan mandiri.", category: "Artistic", subcategory: "Artistic" },
  { id: 125, text: "Saya menghargai seni, musik, dan sastra.", category: "Artistic", subcategory: "Artistic" },
  { id: 126, text: "Saya lebih suka bekerja dengan ide dan benda daripada dengan orang.", category: "Artistic", subcategory: "Artistic" },
  { id: 127, text: "Saya tidak suka aturan atau rutinitas yang ketat.", category: "Artistic", subcategory: "Artistic" },
  { id: 128, text: "Saya melihat dunia melalui sudut pandang yang kreatif dan tidak konvensional.", category: "Artistic", subcategory: "Artistic" },
  { id: 129, text: "Saya pandai dalam menciptakan ide-ide baru.", category: "Artistic", subcategory: "Artistic" },
  { id: 130, text: "Ekspresi diri sangat penting bagi saya.", category: "Artistic", subcategory: "Artistic" },

  // Sosial (S) - "Para Penolong"
  { id: 131, text: "Saya senang membantu, mengajar, atau memberikan konseling kepada orang lain.", category: "Social", subcategory: "Social" },
  { id: 132, text: "Saya pandai memahami dan berempati dengan perasaan orang lain.", category: "Social", subcategory: "Social" },
  { id: 133, text: "Saya suka bekerja dalam kelompok dan berkolaborasi dengan orang lain.", category: "Social", subcategory: "Social" },
  { id: 134, text: "Saya adalah orang yang ramah, suka menolong, dan kooperatif.", category: "Social", subcategory: "Social" },
  { id: 135, text: "Saya menghargai hubungan dan membuat perbedaan di komunitas saya.", category: "Social", subcategory: "Social" },
  { id: 136, text: "Saya lebih suka bekerja dengan orang daripada dengan benda atau ide.", category: "Social", subcategory: "Social" },
  { id: 137, text: "Saya adalah pendengar yang baik dan orang sering datang kepada saya dengan masalah mereka.", category: "Social", subcategory: "Social" },
  { id: 138, text: "Saya senang melakukan aktivitas seperti volunteering, mentoring, atau layanan pelanggan.", category: "Social", subcategory: "Social" },
  { id: 139, text: "Saya terampil dalam berkomunikasi dan menyelesaikan konflik.", category: "Social", subcategory: "Social" },
  { id: 140, text: "Membuat orang merasa nyaman dan didukung adalah hal yang penting bagi saya.", category: "Social", subcategory: "Social" },

  // Enterprising/Kewirausahaan (E) - "Para Persuader"
  { id: 141, text: "Saya senang memimpin, membujuk, dan memotivasi orang lain.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 142, text: "Saya ambisius dan senang mengambil tantangan untuk mendapatkan imbalan yang tinggi.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 143, text: "Saya pandai berbicara di depan umum dan menjual ide atau produk.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 144, text: "Saya adalah orang yang energik, percaya diri, dan tegas.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 145, text: "Saya suka bekerja di posisi yang berpengaruh dan memiliki otoritas.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 146, text: "Saya lebih suka bekerja dengan orang dan data daripada dengan benda.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 147, text: "Saya tertarik pada bisnis, politik, dan keuangan.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 148, text: "Saya senang mengambil risiko dan membuat keputusan.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 149, text: "Saya pandai mengorganisir dan mengelola proyek atau orang.", category: "Enterprising", subcategory: "Enterprising" },
  { id: 150, text: "Saya kompetitif dan suka menang.", category: "Enterprising", subcategory: "Enterprising" },

  // Konvensional (C) - "Para Pengorganisir"
  { id: 151, text: "Saya senang bekerja dengan data, angka, dan detail.", category: "Conventional", subcategory: "Conventional" },
  { id: 152, text: "Saya suka bekerja di lingkungan yang terstruktur dengan aturan dan prosedur yang jelas.", category: "Conventional", subcategory: "Conventional" },
  { id: 153, text: "Saya pandai mengorganisir informasi, menyimpan catatan, dan mengikuti rencana.", category: "Conventional", subcategory: "Conventional" },
  { id: 154, text: "Saya adalah orang yang hati-hati, teratur, dan bertanggung jawab.", category: "Conventional", subcategory: "Conventional" },
  { id: 155, text: "Saya menghargai akurasi dan efisiensi.", category: "Conventional", subcategory: "Conventional" },
  { id: 156, text: "Saya lebih suka bekerja dengan data dan benda daripada dengan ide.", category: "Conventional", subcategory: "Conventional" },
  { id: 157, text: "Saya pandai dalam tugas-tugas yang membutuhkan ketepatan dan perhatian terhadap detail.", category: "Conventional", subcategory: "Conventional" },
  { id: 158, text: "Saya lebih suka memiliki instruksi yang jelas dan tahu persis apa yang diharapkan dari saya.", category: "Conventional", subcategory: "Conventional" },
  { id: 159, text: "Saya senang melakukan aktivitas seperti akuntansi, pemrograman, atau mengelola database.", category: "Conventional", subcategory: "Conventional" },
  { id: 160, text: "Saya dapat diandalkan dan menganggap serius tanggung jawab saya.", category: "Conventional", subcategory: "Conventional" },
];

// VIA Character Strengths Questions (96 questions total - 24 strengths × 4 questions each)
export const viaQuestions: Question[] = [
  // KEBIJAKSANAAN (WISDOM)

  // 1. Kreativitas
  { id: 201, text: "Saya selalu menemukan cara-cara baru untuk melakukan sesuatu.", category: "Wisdom", subcategory: "Creativity" },
  { id: 202, text: "Memikirkan ide-ide baru adalah salah satu kekuatan terbesar saya.", category: "Wisdom", subcategory: "Creativity" },
  { id: 203, text: "Saya adalah pemikir yang orisinal.", category: "Wisdom", subcategory: "Creativity" },
  { id: 204, text: "Ketika saya memiliki masalah, saya senang menemukan solusi kreatif.", category: "Wisdom", subcategory: "Creativity" },

  // 2. Rasa Ingin Tahu
  { id: 205, text: "Saya selalu mengeksplorasi dunia dan bertanya \"mengapa?\"", category: "Wisdom", subcategory: "Curiosity" },
  { id: 206, text: "Saya menemukan banyak hal yang menarik.", category: "Wisdom", subcategory: "Curiosity" },
  { id: 207, text: "Saya mudah bosan dengan hal-hal yang sudah pernah saya alami.", category: "Wisdom", subcategory: "Curiosity" },
  { id: 208, text: "Saya suka mengunjungi tempat-tempat baru dan belajar tentang tempat tersebut.", category: "Wisdom", subcategory: "Curiosity" },

  // 3. Penilaian / Berpikir Kritis
  { id: 209, text: "Saya selalu mempertimbangkan untung rugi sebelum membuat keputusan.", category: "Wisdom", subcategory: "Judgment" },
  { id: 210, text: "Teman-teman saya datang kepada saya untuk meminta nasihat karena saya melihat hal-hal dengan jelas dan tanpa bias.", category: "Wisdom", subcategory: "Judgment" },
  { id: 211, text: "Saya memastikan memiliki semua fakta sebelum membentuk opini.", category: "Wisdom", subcategory: "Judgment" },
  { id: 212, text: "Memikirkan segala sesuatu dengan matang adalah bagian penting dari diri saya.", category: "Wisdom", subcategory: "Judgment" },

  // 4. Cinta Belajar
  { id: 213, text: "Saya sangat senang ketika bisa mempelajari sesuatu yang baru.", category: "Wisdom", subcategory: "Love of Learning" },
  { id: 214, text: "Saya menikmati tantangan menguasai subjek yang sulit.", category: "Wisdom", subcategory: "Love of Learning" },
  { id: 215, text: "Saya adalah pembelajar seumur hidup.", category: "Wisdom", subcategory: "Love of Learning" },
  { id: 216, text: "Saya sering membaca buku atau artikel untuk meningkatkan pengetahuan saya.", category: "Wisdom", subcategory: "Love of Learning" },

  // 5. Perspektif
  { id: 217, text: "Orang-orang menggambarkan saya sebagai orang yang bijaksana.", category: "Wisdom", subcategory: "Perspective" },
  { id: 218, text: "Saya memiliki kemampuan untuk melihat gambaran besar dalam situasi yang kompleks.", category: "Wisdom", subcategory: "Perspective" },
  { id: 219, text: "Saya mampu melihat hal-hal dari berbagai sudut pandang yang berbeda, yang membantu saya memberikan nasihat yang baik.", category: "Wisdom", subcategory: "Perspective" },
  { id: 220, text: "Saya sering dapat menemukan cara untuk memahami dunia ketika orang lain bingung.", category: "Wisdom", subcategory: "Perspective" },

  // KEBERANIAN (COURAGE)

  // 6. Keberanian
  { id: 221, text: "Saya adalah orang yang berani, bahkan ketika saya merasa takut.", category: "Courage", subcategory: "Bravery" },
  { id: 222, text: "Saya selalu membela apa yang benar, meskipun itu berarti menghadapi perlawanan.", category: "Courage", subcategory: "Bravery" },
  { id: 223, text: "Saya tidak mundur dari ancaman atau tantangan.", category: "Courage", subcategory: "Bravery" },
  { id: 224, text: "Menghadapi ketakutan saya membuat saya merasa lebih kuat.", category: "Courage", subcategory: "Bravery" },

  // 7. Ketekunan
  { id: 225, text: "Saya tidak pernah menyerah pada tujuan setelah saya memulainya.", category: "Courage", subcategory: "Perseverance" },
  { id: 226, text: "Saya adalah pekerja keras dan menyelesaikan apa yang saya mulai.", category: "Courage", subcategory: "Perseverance" },
  { id: 227, text: "Kemunduran tidak membuat saya putus asa; justru membuat saya bekerja lebih keras.", category: "Courage", subcategory: "Perseverance" },
  { id: 228, text: "Saya rajin dan disiplin dalam pekerjaan saya.", category: "Courage", subcategory: "Perseverance" },

  // 8. Kejujuran
  { id: 229, text: "Saya menjalani hidup saya dengan cara yang tulus dan autentik.", category: "Courage", subcategory: "Honesty" },
  { id: 230, text: "Berkata jujur lebih penting bagi saya daripada menjadi populer.", category: "Courage", subcategory: "Honesty" },
  { id: 231, text: "Saya adalah orang yang apa adanya; saya tidak berpura-pura menjadi sesuatu yang bukan diri saya.", category: "Courage", subcategory: "Honesty" },
  { id: 232, text: "Teman dan keluarga saya tahu bahwa mereka dapat mengandalkan saya untuk bersikap terus terang.", category: "Courage", subcategory: "Honesty" },

  // 9. Semangat Hidup
  { id: 233, text: "Saya bangun dengan perasaan bersemangat untuk memulai hari.", category: "Courage", subcategory: "Zest" },
  { id: 234, text: "Saya mendekati segala sesuatu yang saya lakukan dengan energi dan antusiasme.", category: "Courage", subcategory: "Zest" },
  { id: 235, text: "Saya merasa hidup dan penuh vitalitas.", category: "Courage", subcategory: "Zest" },
  { id: 236, text: "Saya ingin menjalani hidup sepenuhnya.", category: "Courage", subcategory: "Zest" },

  // KEMANUSIAAN (HUMANITY)

  // 10. Cinta
  { id: 237, text: "Saya merasakan koneksi yang mendalam dengan orang-orang yang dekat dengan saya.", category: "Humanity", subcategory: "Love" },
  { id: 238, text: "Saya berada pada kondisi terbaik ketika saya berbagi hidup dengan orang lain.", category: "Humanity", subcategory: "Love" },
  { id: 239, text: "Mudah bagi saya untuk mengekspresikan cinta dan kehangatan kepada orang lain.", category: "Humanity", subcategory: "Love" },
  { id: 240, text: "Saya menghargai hubungan dekat saya di atas segalanya.", category: "Humanity", subcategory: "Love" },

  // 11. Kebaikan
  { id: 241, text: "Saya suka melakukan perbuatan baik untuk orang lain, bahkan jika mereka adalah orang asing.", category: "Humanity", subcategory: "Kindness" },
  { id: 242, text: "Saya adalah orang yang murah hati dan peduli.", category: "Humanity", subcategory: "Kindness" },
  { id: 243, text: "Membantu orang lain adalah salah satu hal terpenting bagi saya.", category: "Humanity", subcategory: "Kindness" },
  { id: 244, text: "Saya senang merawat orang-orang.", category: "Humanity", subcategory: "Kindness" },

  // 12. Kecerdasan Sosial
  { id: 245, text: "Saya terampil dalam memahami apa yang membuat orang lain bergerak.", category: "Humanity", subcategory: "Social Intelligence" },
  { id: 246, text: "Saya selalu sadar akan perasaan saya sendiri dan perasaan orang-orang di sekitar saya.", category: "Humanity", subcategory: "Social Intelligence" },
  { id: 247, text: "Saya tahu apa yang harus dilakukan untuk membuat orang lain merasa nyaman.", category: "Humanity", subcategory: "Social Intelligence" },
  { id: 248, text: "Saya dapat dengan mudah menyesuaikan perilaku saya untuk cocok dengan kelompok orang yang berbeda.", category: "Humanity", subcategory: "Social Intelligence" },

  // KEADILAN (JUSTICE)

  // 13. Kerja Tim
  { id: 249, text: "Saya adalah anggota yang setia dan berdedikasi dari setiap kelompok yang saya ikuti.", category: "Justice", subcategory: "Teamwork" },
  { id: 250, text: "Saya bekerja paling baik ketika saya berkolaborasi dengan orang lain.", category: "Justice", subcategory: "Teamwork" },
  { id: 251, text: "Saya selalu melakukan bagian saya dalam proyek kelompok.", category: "Justice", subcategory: "Teamwork" },
  { id: 252, text: "Saya merasakan rasa tanggung jawab yang kuat terhadap tim yang saya ikuti.", category: "Justice", subcategory: "Teamwork" },

  // 14. Keadilan
  { id: 253, text: "Saya percaya dalam memberikan kesempatan yang adil kepada semua orang.", category: "Justice", subcategory: "Fairness" },
  { id: 254, text: "Saya memperlakukan semua orang dengan sama, terlepas dari latar belakang mereka.", category: "Justice", subcategory: "Fairness" },
  { id: 255, text: "Saya tidak tahan melihat orang diperlakukan secara tidak adil.", category: "Justice", subcategory: "Fairness" },
  { id: 256, text: "Keputusan saya dipandu oleh rasa keadilan yang kuat.", category: "Justice", subcategory: "Fairness" },

  // 15. Kepemimpinan
  { id: 257, text: "Saya pandai mengorganisir kelompok untuk menyelesaikan sesuatu.", category: "Justice", subcategory: "Leadership" },
  { id: 258, text: "Orang-orang melihat kepada saya untuk memimpin jalan.", category: "Justice", subcategory: "Leadership" },
  { id: 259, text: "Saya senang merencanakan dan mengarahkan aktivitas untuk kelompok.", category: "Justice", subcategory: "Leadership" },
  { id: 260, text: "Saya memastikan setiap orang dalam kelompok saya merasa dilibatkan dan dihargai.", category: "Justice", subcategory: "Leadership" },

  // PENGENDALIAN DIRI (TEMPERANCE)

  // 16. Pengampunan
  { id: 261, text: "Saya adalah orang yang pemaaf; saya tidak menyimpan dendam.", category: "Temperance", subcategory: "Forgiveness" },
  { id: 262, text: "Saya selalu berusaha memberikan kesempatan kedua kepada orang.", category: "Temperance", subcategory: "Forgiveness" },
  { id: 263, text: "Saya percaya pada belas kasihan dan melepaskan kemarahan.", category: "Temperance", subcategory: "Forgiveness" },
  { id: 264, text: "Ketika seseorang menyakiti saya, saya berusaha memahami sisi cerita mereka.", category: "Temperance", subcategory: "Forgiveness" },

  // 17. Kerendahan Hati / Kesederhanaan
  { id: 265, text: "Saya lebih suka membiarkan tindakan saya berbicara sendiri.", category: "Temperance", subcategory: "Humility" },
  { id: 266, text: "Saya tidak mencari sorotan atau perlu menjadi pusat perhatian.", category: "Temperance", subcategory: "Humility" },
  { id: 267, text: "Saya sadar akan keterbatasan saya dan tidak berlebihan dalam menyatakan pencapaian saya.", category: "Temperance", subcategory: "Humility" },
  { id: 268, text: "Orang akan mengatakan saya adalah orang yang rendah hati.", category: "Temperance", subcategory: "Humility" },

  // 18. Kehati-hatian
  { id: 269, text: "Saya adalah orang yang sangat hati-hati.", category: "Temperance", subcategory: "Prudence" },
  { id: 270, text: "Saya menghindari melakukan hal-hal yang mungkin akan saya sesali kemudian.", category: "Temperance", subcategory: "Prudence" },
  { id: 271, text: "Saya memikirkan konsekuensi sebelum bertindak.", category: "Temperance", subcategory: "Prudence" },
  { id: 272, text: "Saya bukan pengambil risiko.", category: "Temperance", subcategory: "Prudence" },

  // 19. Pengaturan Diri
  { id: 273, text: "Saya adalah orang yang disiplin dan dapat mengendalikan keinginan saya.", category: "Temperance", subcategory: "Self-Regulation" },
  { id: 274, text: "Saya pandai menahan godaan.", category: "Temperance", subcategory: "Self-Regulation" },
  { id: 275, text: "Saya dapat mengendalikan emosi saya.", category: "Temperance", subcategory: "Self-Regulation" },
  { id: 276, text: "Saya mengendalikan tindakan saya.", category: "Temperance", subcategory: "Self-Regulation" },

  // TRANSENDENSI (TRANSCENDENCE)

  // 20. Apresiasi terhadap Keindahan & Keunggulan
  { id: 277, text: "Saya sering merasakan rasa kagum ketika melihat sesuatu yang indah di alam.", category: "Transcendence", subcategory: "Appreciation of Beauty" },
  { id: 278, text: "Saya sangat menghargai seni, musik, dan pertunjukan yang terampil.", category: "Transcendence", subcategory: "Appreciation of Beauty" },
  { id: 279, text: "Saya memperhatikan keindahan di sekitar saya setiap hari.", category: "Transcendence", subcategory: "Appreciation of Beauty" },
  { id: 280, text: "Menyaksikan tindakan keunggulan memberikan saya sensasi yang luar biasa.", category: "Transcendence", subcategory: "Appreciation of Beauty" },

  // 21. Rasa Syukur
  { id: 281, text: "Saya sering berhenti untuk menghitung berkat-berkat saya.", category: "Transcendence", subcategory: "Gratitude" },
  { id: 282, text: "Saya merasakan rasa terima kasih yang mendalam untuk hal-hal baik dalam hidup saya.", category: "Transcendence", subcategory: "Gratitude" },
  { id: 283, text: "Saya berusaha mengekspresikan terima kasih saya kepada orang lain.", category: "Transcendence", subcategory: "Gratitude" },
  { id: 284, text: "Saya adalah orang yang sadar dan bersyukur.", category: "Transcendence", subcategory: "Gratitude" },

  // 22. Harapan
  { id: 285, text: "Saya optimis tentang masa depan saya.", category: "Transcendence", subcategory: "Hope" },
  { id: 286, text: "Saya percaya bahwa hal-hal baik akan terjadi.", category: "Transcendence", subcategory: "Hope" },
  { id: 287, text: "Saya bekerja keras untuk mencapai tujuan saya karena saya berharap untuk berhasil.", category: "Transcendence", subcategory: "Hope" },
  { id: 288, text: "Bahkan ketika keadaan sulit, saya tetap fokus pada hasil yang positif.", category: "Transcendence", subcategory: "Hope" },

  // 23. Humor
  { id: 289, text: "Saya suka tertawa dan membuat orang lain tertawa.", category: "Transcendence", subcategory: "Humor" },
  { id: 290, text: "Saya memiliki sisi yang suka bermain dan senang bercanda.", category: "Transcendence", subcategory: "Humor" },
  { id: 291, text: "Saya selalu dapat menemukan sisi terang dari situasi yang sulit.", category: "Transcendence", subcategory: "Humor" },
  { id: 292, text: "Membuat seseorang tersenyum membuat hari saya menjadi cerah.", category: "Transcendence", subcategory: "Humor" },

  // 24. Spiritualitas
  { id: 293, text: "Iman atau kepercayaan saya memberikan makna dan tujuan dalam hidup saya.", category: "Transcendence", subcategory: "Spirituality" },
  { id: 294, text: "Saya merasakan koneksi yang kuat dengan kekuatan yang lebih tinggi atau alam semesta secara keseluruhan.", category: "Transcendence", subcategory: "Spirituality" },
  { id: 295, text: "Kepercayaan saya membentuk tindakan saya dan siapa diri saya.", category: "Transcendence", subcategory: "Spirituality" },
  { id: 296, text: "Saya memiliki rasa tujuan yang melampaui kehidupan sehari-hari saya.", category: "Transcendence", subcategory: "Spirituality" },
];

// Assessment Configurations
export const assessmentTypes: AssessmentType[] = [
  {
    id: 'big-five',
    name: 'Big Five Personality',
    description: 'Inventori Lima Besar (BFI-44): Penilaian Diri',
    totalQuestions: 44,
    scaleType: '7-point',
    scaleLabels: [
      'Sangat Tidak Setuju',
      'Tidak Setuju',
      'Agak Tidak Setuju',
      'Netral',
      'Agak Setuju',
      'Setuju',
      'Sangat Setuju'
    ],
    questions: bigFiveQuestions
  },
  {
    id: 'riasec',
    name: 'RIASEC Holland Codes',
    description: 'Kode Holland RIASEC: Penilaian Diri',
    totalQuestions: 60,
    scaleType: '7-point',
    scaleLabels: [
      'Sangat Tidak Sesuai',
      'Tidak Sesuai',
      'Agak Tidak Sesuai',
      'Netral',
      'Agak Sesuai',
      'Sesuai',
      'Sangat Sesuai'
    ],
    questions: riasecQuestions
  },
  {
    id: 'via-character',
    name: 'VIA Character Strengths',
    description: 'Kekuatan Karakter VIA: Penilaian Diri',
    totalQuestions: 96,
    scaleType: '7-point',
    scaleLabels: [
      'Sangat Tidak Sesuai',
      'Tidak Sesuai',
      'Agak Tidak Sesuai',
      'Netral',
      'Agak Sesuai',
      'Sesuai',
      'Sangat Sesuai'
    ],
    questions: viaQuestions
  }
];

// Helper functions
export const getAssessmentById = (id: string): AssessmentType | undefined => {
  return assessmentTypes.find(assessment => assessment.id === id);
};

export const getQuestionsByCategory = (questions: Question[], category: string): Question[] => {
  return questions.filter(question => question.category === category);
};

export const getQuestionsBySubcategory = (questions: Question[], subcategory: string): Question[] => {
  return questions.filter(question => question.subcategory === subcategory);
};

// Scale configurations for different assessment types
export const scaleConfigurations = {
  '5-point': {
    values: [1, 2, 3, 4, 5],
    colors: ['#e53935', '#e53935', '#64707d', '#43a047', '#43a047']
  },
  '7-point': {
    values: [1, 2, 3, 4, 5, 6, 7],
    colors: ['#e53935', '#e53935', '#e53935', '#64707d', '#43a047', '#43a047', '#43a047']
  }
};
