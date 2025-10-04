# Chat AI Initial Messages Fix

## Problem
Ketika pengguna membuat percakapan baru menggunakan endpoint `POST /api/chatbot/conversations`, tampilan chat menampilkan pesan "Belum ada pesan. Mulai percakapan dengan mengirim pesan!" meskipun API mengembalikan `initial_messages` dalam response.

## Root Cause
File `src/services/helpers/chat.js` tidak mengekstrak dan mengembalikan `initial_messages` dari response API. Kode sebelumnya hanya mengembalikan array kosong untuk messages:

```javascript
messages: [],  // ❌ Selalu kosong
```

## Solution
Updated `src/services/helpers/chat.js` untuk:

### 1. Extract initial_messages dari API Response
```javascript
const initialMessages = genericResponse.data.data?.initial_messages || [];

// Map initial_messages to internal message format
const messages = initialMessages.map((msg) => ({
  id: msg.id,
  role: msg.sender_type === 'assistant' ? 'assistant' : msg.sender_type,
  content: msg.content,
  timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
  resultId: data.resultId,
}));
```

### 2. Handle Snake_case and CamelCase Field Names
API menggunakan `snake_case` (e.g., `sender_type`, `created_at`) sedangkan frontend menggunakan `camelCase`. Perubahan ini menangani kedua format:
- `sender_type` → `role`
- `created_at` / `timestamp` → `timestamp`
- `last_activity` / `lastActivity` → `updatedAt`

### 3. Support Multiple Message Sources
Updated logic untuk prioritize initial_messages dari berbagai sumber:
- `initial_messages` dari create conversation response
- `initial_messages` dari get conversation detail response
- `messages` array sebagai fallback
- Dedicated messages endpoint jika tersedia

## Files Modified
- `src/services/helpers/chat.js`:
  - `startConversation()` - Extract initial_messages dari POST response
  - `getConversation()` - Extract initial_messages dari GET response
  - Recovery logic untuk existing conversations

## API Response Structure Handled
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Career Guidance Session",
      "context_type": "career_guidance",
      "status": "active",
      "created_at": "2025-10-04T10:00:00Z",
      "updated_at": "2025-10-04T10:00:00Z"
    },
    "initial_messages": [
      {
        "id": "msg-assistant-001",
        "sender_type": "assistant",
        "content": "Halo! Saya adalah Guider...",
        "content_type": "text",
        "timestamp": "2025-10-04T10:00:00Z"
      }
    ]
  }
}
```

## Testing
1. Buka aplikasi dan navigasi ke hasil assessment
2. Klik tombol "Chat dengan AI"
3. Verify pesan welcome dari AI langsung muncul (tidak ada pesan kosong)
4. Check console untuk log: `[AI Chat] Conversation created` dengan `serverMessages` count > 0

## Impact
- ✅ User experience improved: Tampilan chat langsung menampilkan pesan welcome
- ✅ No breaking changes: Existing functionality tetap bekerja
- ✅ Better error handling: Support multiple response formats
- ✅ Consistent message display: Semua skenario (new/existing conversation) handled

## Related Files
- `src/components/chat/ChatInterface.tsx` - UI component (no changes needed)
- `src/services/apiService.js` - Public facade (no changes needed)
- `src/config/api.js` - API endpoints configuration (no changes needed)
