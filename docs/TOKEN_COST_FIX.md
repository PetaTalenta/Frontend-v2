# Token Cost Fix: Dari 2 Token Menjadi 1 Token per Assessment

## 🔍 **Masalah yang Ditemukan**

Sistem assessment menghabiskan **2 token** per submission, padahal seharusnya hanya **1 token** per assessment.

### **Akar Masalah**
- Bukan karena duplicate submission atau bug
- Sistem memang dikonfigurasi untuk menggunakan 2 token per assessment
- Hardcoded values tersebar di berbagai file

### **Lokasi Masalah**
1. `utils/token-balance.ts` - Validasi menggunakan >= 2
2. `contexts/TokenContext.tsx` - Logic hasEnoughTokens >= 2  
3. `app/token-balance-test/page.tsx` - Dokumentasi menyebutkan 2 tokens
4. `docs/USER_STATS_SYSTEM.md` - Formula menggunakan × 2
5. `utils/token-notifications.ts` - Default parameter = 2
6. `components/ui/TokenBalance.tsx` - Error message menyebutkan 2 tokens
7. `components/assessment/AssessmentHeader.tsx` - Alert message 2 tokens

## 🛠️ **Solusi yang Diterapkan**

### **1. Perubahan Konfigurasi**
Mengubah semua hardcoded value dari **2** menjadi **1** di file-file berikut:

#### **utils/token-balance.ts**
```typescript
// SEBELUM
hasEnoughTokens: balance >= 2,
message: balance >= 2 ? ... : "need at least 2 tokens"

// SESUDAH  
hasEnoughTokens: balance >= 1,
message: balance >= 1 ? ... : "need at least 1 token"
```

#### **contexts/TokenContext.tsx**
```typescript
// SEBELUM
hasEnoughTokens: newBalance >= 2,
message: "need at least 2 to submit an assessment"

// SESUDAH
hasEnoughTokens: newBalance >= 1, 
message: "need at least 1 to submit an assessment"
```

#### **app/token-balance-test/page.tsx**
```typescript
// SEBELUM
<p><strong>Assessment Cost:</strong> 2 tokens per submission</p>
<p><strong>Formula:</strong> Base (10) + (Completed × 5) - (Processing × 2)</p>

// SESUDAH
<p><strong>Assessment Cost:</strong> 1 token per submission</p>
<p><strong>Formula:</strong> Base (10) + (Completed × 5) - (Processing × 1)</p>
```

### **2. Konfigurasi Terpusat**
Dibuat file `config/token-config.ts` untuk menghindari hardcoded values:

```typescript
export const TOKEN_CONFIG = {
  ASSESSMENT_COST: 1,              // Cost per assessment
  COMPLETION_REWARD: 5,            // Tokens earned per completion
  STARTING_BALANCE: 10,            // Initial tokens
  MIN_TOKENS_FOR_ASSESSMENT: 1,   // Minimum required
} as const;
```

### **3. Helper Functions**
```typescript
// Centralized validation
export function hasEnoughTokensForAssessment(balance: number): boolean {
  return balance >= TOKEN_CONFIG.MIN_TOKENS_FOR_ASSESSMENT;
}

// Consistent error messages
export function getInsufficientTokensMessage(currentBalance: number): string {
  return `Insufficient tokens. You have ${currentBalance} token${currentBalance !== 1 ? 's' : ''} but need at least ${TOKEN_CONFIG.MIN_TOKENS_FOR_ASSESSMENT} token to submit an assessment.`;
}
```

## 📋 **File yang Diubah**

### **Core Files**
- ✅ `utils/token-balance.ts` - Validasi dan logic utama
- ✅ `contexts/TokenContext.tsx` - State management
- ✅ `utils/token-notifications.ts` - Notification messages
- ✅ `components/ui/TokenBalance.tsx` - UI component
- ✅ `components/assessment/AssessmentHeader.tsx` - Error handling

### **Documentation & Config**
- ✅ `app/token-balance-test/page.tsx` - Test page documentation
- ✅ `docs/USER_STATS_SYSTEM.md` - System documentation
- ✅ `config/token-config.ts` - **NEW** Centralized configuration

## 🧪 **Testing**

### **Sebelum Fix**
```
Token Balance: 2
Assessment Cost: 2 tokens
Result: Can submit ✅ (2 >= 2)

Token Balance: 1  
Assessment Cost: 2 tokens
Result: Cannot submit ❌ (1 < 2)
```

### **Sesudah Fix**
```
Token Balance: 1
Assessment Cost: 1 token
Result: Can submit ✅ (1 >= 1)

Token Balance: 0
Assessment Cost: 1 token  
Result: Cannot submit ❌ (0 < 1)
```

## 🔮 **Manfaat**

1. **Konsistensi**: Semua validasi menggunakan konfigurasi terpusat
2. **Maintainability**: Mudah mengubah token cost di masa depan
3. **User Experience**: Assessment lebih terjangkau (1 token vs 2 token)
4. **Scalability**: Konfigurasi dapat disesuaikan per environment

## ⚠️ **Catatan Penting**

### **Backend Consideration**
Pastikan backend API juga dikonfigurasi untuk mengurangi **1 token** per assessment, bukan 2 token.

### **Database Migration**
Jika ada data historis yang menggunakan formula lama, pertimbangkan untuk:
- Migrasi data existing users
- Adjustment token balance yang sudah terpotong 2 token

### **Environment Variables**
Pertimbangkan untuk membuat environment variable:
```env
NEXT_PUBLIC_ASSESSMENT_TOKEN_COST=1
NEXT_PUBLIC_COMPLETION_REWARD=5
NEXT_PUBLIC_STARTING_BALANCE=10
```

## 🎯 **Next Steps**

1. **Test thoroughly** - Pastikan semua flow assessment bekerja dengan 1 token
2. **Backend sync** - Koordinasi dengan backend untuk memastikan konsistensi
3. **User communication** - Informasikan perubahan ke users jika diperlukan
4. **Monitoring** - Monitor token usage patterns setelah perubahan

---

*Fix implemented on: $(date)*
*Files affected: 8 files*
*Impact: Reduced assessment cost from 2 tokens to 1 token*
