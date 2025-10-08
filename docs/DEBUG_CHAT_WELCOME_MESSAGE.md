# 🔍 Debugging Guide: Chat Welcome Message Issue

## Masalah
Ketika pertama kali masuk ke halaman chat AI, hanya muncul pesan "Belum ada pesan. Mulai percakapan dengan mengirim pesan!" padahal API sudah mengirim welcome message dari assistant.

## Root Cause Analysis

### Kemungkinan Penyebab

#### 1️⃣ **Mismatch Struktur Response API**
Frontend mengharapkan struktur:
```javascript
{
  success: true,
  data: {
    conversationId: "...",
    personalizedWelcome: {
      messageId: "msg-assistant-001",
      content: "Halo! Saya adalah Guider...",
      timestamp: "2025-10-08T..."
    }
  }
}
```

Tapi API mungkin mengirim:
```javascript
{
  success: true,
  data: {
    conversationId: "...",
    messages: [
      {
        id: "msg-assistant-001",
        sender_type: "assistant",
        content: "Halo! Saya adalah Guider...",
        content_type: "text",
        timestamp: "..."
      }
    ]
  }
}
```

#### 2️⃣ **Field Mapping Tidak Sesuai**
- API: `id` vs Frontend: `messageId`
- API: `sender_type` vs Frontend: `role`
- API: `messages` array vs Frontend: `personalizedWelcome` object

#### 3️⃣ **`personalizedWelcome` Undefined**
Jika API tidak mengirim field `personalizedWelcome`, maka:
```javascript
messages: apiData.personalizedWelcome ? [...] : []
```
Akan return array kosong, sehingga tidak ada pesan yang ditampilkan.

---

## Cara Debug

### Step 1: Gunakan Debug Tool HTML

1. Buka file: `testing/debug-tools/debug-chat-welcome-message.html` di browser
2. Masukkan:
   - Bearer Token (dari localStorage atau login)
   - Assessment ID / Result ID
3. Klik "Test Create Conversation"
4. Perhatikan output di console

**Yang harus diperiksa:**
- ✅ Apakah `personalizedWelcome` ada?
- ✅ Apakah `messages` array ada?
- ✅ Field apa saja yang dikirim API?
- ✅ Struktur message seperti apa?

### Step 2: Periksa Browser Console

Setelah menjalankan aplikasi Next.js (`npm run dev`), buka browser console dan cari log:

```
🔍 [DEBUG] API Response Structure:
  conversationId: "..."
  hasPersonalizedWelcome: true/false
  hasMessages: true/false
  messagesLength: 0/1/2...
  personalizedWelcomeStructure: [...]
  firstMessageStructure: [...]
```

```
🔍 [ChatInterface] Messages from API:
  serverMessagesCount: 0/1/2...
  serverMessages: [...]
  mergedCount: 0/1/2...
```

### Step 3: Analisis Output

**Jika `hasPersonalizedWelcome: false` dan `hasMessages: true`:**
→ API menggunakan struktur `messages` array, bukan `personalizedWelcome` object

**Jika `serverMessagesCount: 0`:**
→ Frontend tidak berhasil mapping response API ke messages

---

## Solusi yang Sudah Diterapkan

### ✅ Update 1: Enhanced Debugging di `chat.js`

File: `src/services/helpers/chat.js`

Sekarang kode akan:
1. Log struktur response API secara detail
2. Cek apakah `personalizedWelcome` ada
3. Cek apakah `messages` array ada
4. **Otomatis fallback ke `messages` array jika `personalizedWelcome` tidak ada**

```javascript
// Check if welcome message is in messages array instead of personalizedWelcome
let welcomeMessages = [];

if (apiData.personalizedWelcome) {
  // Struktur lama: personalizedWelcome object
  welcomeMessages = [{...}];
} else if (apiData.messages && Array.isArray(apiData.messages)) {
  // Struktur baru: messages array dengan assistant message
  welcomeMessages = apiData.messages
    .filter(msg => msg.sender_type === 'assistant' || ...)
    .map(msg => ({...}));
}
```

### ✅ Update 2: Enhanced Debugging di `ChatInterface.tsx`

File: `src/components/chat/ChatInterface.tsx`

Sekarang akan log:
- Berapa messages dari server
- Berapa messages hasil merge
- Apakah messages akan di-set ke state

---

## Testing Steps

### 1. Build & Run Development Server
```powershell
npm run dev
```

### 2. Login & Buka Chat AI
1. Login ke aplikasi
2. Lakukan assessment atau buka hasil assessment
3. Klik untuk membuka chat AI
4. **Buka Browser Console (F12)**

### 3. Analisis Console Output

**Cari log berikut:**

```
🔍 [DEBUG] API Response Structure:
✅ [DEBUG] Using personalizedWelcome structure
// atau
✅ [DEBUG] Using messages array structure, found: 1 assistant messages
```

```
🔍 [ChatInterface] Messages from API:
  serverMessagesCount: 1
  mergedCount: 1
  willSetToState: true
```

**Jika `serverMessagesCount: 0` tetapi API mengirim message:**
→ Berarti mapping masih salah, perlu adjustment lebih lanjut

**Jika `mergedCount: 1` tapi UI tetap kosong:**
→ Ada issue di rendering component

### 4. Periksa localStorage

Buka Console dan jalankan:
```javascript
// Cek messages yang disimpan
const resultId = 'YOUR_RESULT_ID'; // ganti dengan result ID Anda
const messages = localStorage.getItem(`chat:${resultId}:messages`);
console.log('Stored messages:', JSON.parse(messages));
```

---

## Expected Behavior Setelah Fix

### ✅ Scenario 1: API mengirim `personalizedWelcome`
```javascript
{
  data: {
    conversationId: "conv-123",
    personalizedWelcome: {
      messageId: "msg-001",
      content: "Halo! Saya adalah Guider...",
      timestamp: "..."
    }
  }
}
```
→ Frontend akan mapping dan menampilkan welcome message

### ✅ Scenario 2: API mengirim `messages` array
```javascript
{
  data: {
    conversationId: "conv-123",
    messages: [
      {
        id: "msg-001",
        sender_type: "assistant",
        content: "Halo! Saya adalah Guider...",
        timestamp: "..."
      }
    ]
  }
}
```
→ Frontend akan fallback ke `messages` array dan menampilkan welcome message

### ✅ UI Result
Setelah masuk chat AI, seharusnya langsung muncul:

```
┌─────────────────────────────────────────────┐
│  🤖 Assistant                               │
│  ─────────────────────────────────────────  │
│  Halo! Saya adalah Guider, asisten AI yang │
│  akan membantu Anda dalam pengembangan      │
│  karir berdasarkan profil persona yang      │
│  Anda berikan...                            │
└─────────────────────────────────────────────┘
```

---

## Next Actions

### 🔴 Jika Masih Belum Muncul

1. **Share console output** dari:
   - `🔍 [DEBUG] API Response Structure`
   - `🔍 [ChatInterface] Messages from API`

2. **Test dengan debug HTML tool**:
   - Buka `testing/debug-tools/debug-chat-welcome-message.html`
   - Copy paste full API response

3. **Check API documentation**:
   - Pastikan endpoint `/api/chatbot/assessment/from-assessment` mengirim welcome message
   - Verifikasi field names yang digunakan

### 🟢 Jika Sudah Muncul

1. **Remove debugging logs** (optional):
   - Hapus console.log yang ditambahkan
   - Atau biarkan untuk monitoring

2. **Test edge cases**:
   - Refresh page (messages persist?)
   - Multiple users (cross-user?)
   - Error handling

---

## Files Modified

1. ✅ `src/services/helpers/chat.js` - Enhanced response mapping
2. ✅ `src/components/chat/ChatInterface.tsx` - Enhanced debugging
3. ✅ `testing/debug-tools/debug-chat-welcome-message.html` - New debug tool

---

## Contact & Support

Jika masalah masih berlanjut, mohon share:
1. Screenshot browser console
2. Full API response dari debug tool
3. Network tab (Chrome DevTools) untuk request `/api/chatbot/assessment/from-assessment`
