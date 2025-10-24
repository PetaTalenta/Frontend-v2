# Rencana Implementasi Personalisasi Header Dashboard

## Masalah Saat Ini
Header dashboard menampilkan placeholder text statis:
- "Welcome, John Doe!"
- "Track your progress here, You almost reach your goal."

Data user yang digunakan adalah dummy data:
```typescript
const dummyUser = {
  name: 'John Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  avatar: ''
};
```

## Tujuan Implementasi
Mengganti placeholder text dengan data dinamis berdasarkan user yang sedang login, sehingga header menjadi personal dan relevan.

## Sumber Data User
Data user tersedia melalui:
1. **useAuth hook** - menyediakan data user yang sedang login
2. **TokenManager** - menyimpan user data di localStorage
3. **Profile API** - menyediakan data profile lengkap user

## Rencana Implementasi

### Phase 1: Analisis & Persiapan
- [x] Analisis struktur header component
- [x] Identifikasi sumber data user yang tersedia
- [x] Buat rencana implementasi

### Phase 2: Modifikasi Header Component
- [ ] Update interface HeaderProps untuk menerima data user
- [ ] Hapus dummyUser data
- [ ] Tambahkan logic untuk menampilkan nama user dinamis
- [ ] Implementasi personalized welcome message
- [ ] Implementasi dynamic progress description

### Phase 3: Integrasi dengan DashboardClient
- [ ] Import dan gunakan useAuth hook di DashboardClient
- [ ] Teruskan data user ke Header component
- [ ] Handle loading state saat data user belum tersedia
- [ ] Handle error state jika data user gagal dimuat

### Phase 4: Personalisasi Konten
- [ ] Implementasi welcome message berdasarkan waktu (pagi/siang/sore/malam)
- [ ] Implementasi progress description berdasarkan:
  - Jumlah assessment yang sudah diselesaikan
  - Token balance user
  - Progress terakhir user
- [ ] Tambahkan fallback message jika data tidak tersedia

### Phase 5: Testing & Validasi
- [ ] Test dengan berbagai kondisi user data
- [ ] Test loading state
- [ ] Test error state
- [ ] Validasi tampilan di mobile dan desktop

## Detail Implementasi

### 1. Update Header Interface
```typescript
interface HeaderProps {
  title?: string;
  description?: string;
  logout: () => void;
  user?: {
    name?: string;
    username?: string;
    email?: string;
    displayName?: string;
    profile?: {
      full_name?: string;
    };
  };
  isLoading?: boolean;
}
```

### 2. Personalized Welcome Message
```typescript
function getWelcomeMessage(userName?: string) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Pagi' : hour < 15 ? 'Siang' : hour < 18 ? 'Sore' : 'Malam';
  const displayName = userName || 'User';
  return `Selamat ${timeOfDay}, ${displayName}!`;
}
```

### 3. Dynamic Progress Description
```typescript
function getProgressDescription(stats?: DashboardStats, profile?: any) {
  if (!stats) return "Lacak progress Anda di sini.";
  
  const { completed, processing, tokenBalance } = stats;
  
  if (completed === 0) {
    return "Mulai assessment pertama Anda untuk mengetahui potensi diri.";
  } else if (processing > 0) {
    return `Anda memiliki ${processing} assessment sedang diproses.`;
  } else if (tokenBalance < 10) {
    return "Token Anda hampir habis, segera isi ulang untuk melanjutkan.";
  } else {
    return `Anda telah menyelesaikan ${completed} assessment. Lanjutkan progress Anda!`;
  }
}
```

### 4. Integration dengan DashboardClient
```typescript
// Di DashboardClient
const { user, isLoading: userLoading } = useAuth();

// Teruskan ke Header
<Header 
  logout={handleLogout}
  user={user}
  isLoading={userLoading}
/>
```

## Considerations

### 1. Loading State
- Tampilkan skeleton atau placeholder saat data user loading
- Jangan tampilkan "Welcome, User!" saat loading

### 2. Error State
- Tampilkan fallback message jika data user tidak tersedia
- Handle case dimana user data incomplete

### 3. Privacy
- Jangan tampilkan informasi sensitif di header
- Prioritaskan displayName atau full_name dari email

### 4. Performance
- Gunakan memoization untuk prevent unnecessary re-renders
- Cache user data yang sudah di-fetch

## Expected Outcome
Setelah implementasi selesai:
1. Header menampilkan nama user yang sebenarnya
2. Welcome message berubah berdasarkan waktu
3. Progress description relevan dengan kondisi user
4. Tampilan tetap baik saat loading atau error
5. Pengalaman user lebih personal dan engaging

## Next Steps
1. Implementasi sesuai rencana di atas
2. Testing dengan berbagai skenario
3. Update dokumentasi
4. Deploy ke production setelah testing complete