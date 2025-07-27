# WebSocket API Compliance - PetaTalenta Frontend

## Masalah yang Ditemukan

### 1. URL WebSocket Tidak Sesuai
**Masalah**: Test script menggunakan `http://localhost:3002` (mock server)
**Solusi**: Menggunakan `https://api.chhrone.web.id` sesuai dokumentasi API

### 2. Event Subscription Tidak Sesuai
**Masalah**: Menggunakan custom event `subscribe-assessment` yang tidak ada di dokumentasi
**Solusi**: Mengandalkan automatic room joining `user:{userId}` setelah authentication

### 3. Struktur Event Tidak Sesuai
**Masalah**: Event structure tidak mengikuti format yang didefinisikan di dokumentasi API
**Solusi**: Menggunakan format yang tepat sesuai dokumentasi

## Implementasi yang Benar

### 1. Connection Setup
```javascript
const socket = io('https://api.chhrone.web.id', {
  autoConnect: false,
  transports: ['websocket', 'polling']
});
```

### 2. Authentication Flow
```javascript
socket.on('connect', () => {
  // Must authenticate within 10 seconds
  socket.emit('authenticate', { token: 'your-jwt-token' });
});

socket.on('authenticated', (data) => {
  // { success: true, userId: "uuid", email: "user@example.com" }
  console.log('User joined to room:', `user:${data.userId}`);
});

socket.on('auth_error', (error) => {
  // { message: "Token required" | "Authentication timeout" | "Invalid token" }
  console.error('Auth failed:', error.message);
});
```

### 3. Event Handling
```javascript
// Analysis Started
socket.on('analysis-started', (data) => {
  // {
  //   "jobId": "uuid",
  //   "status": "started",
  //   "message": "Your analysis has started processing...",
  //   "metadata": {
  //     "assessmentName": "Assessment Name",
  //     "estimatedProcessingTime": "5-10 minutes"
  //   },
  //   "timestamp": "2024-01-01T12:00:00.000Z"
  // }
});

// Analysis Complete
socket.on('analysis-complete', (data) => {
  // {
  //   "jobId": "uuid",
  //   "resultId": "uuid",
  //   "status": "completed",
  //   "message": "Your analysis is ready!",
  //   "metadata": {
  //     "assessmentName": "Assessment Name",
  //     "processingTime": "7 minutes"
  //   },
  //   "timestamp": "2024-01-01T12:00:00.000Z"
  // }
});

// Analysis Failed
socket.on('analysis-failed', (data) => {
  // {
  //   "jobId": "uuid",
  //   "error": "Error message",
  //   "message": "Analysis failed. Please try again.",
  //   "metadata": {
  //     "assessmentName": "Assessment Name",
  //     "errorType": "PROCESSING_ERROR"
  //   },
  //   "timestamp": "2024-01-01T12:00:00.000Z"
  // }
});
```

## Perubahan yang Dilakukan

### 1. Updated Test Scripts
- `scripts/test-websocket-api.js`: Script baru yang mengikuti dokumentasi API
- `scripts/test-websocket.js`: Updated untuk menggunakan URL yang benar

### 2. Updated WebSocket Service
- `services/websocket-assessment.ts`: URL configuration updated
- Removed custom subscription logic
- Following API documentation event structure

### 3. Updated Hooks
- `hooks/useNotifications.ts`: Updated authentication event handling
- Added proper error handling for API compliance

## Testing

### 1. Test dengan API Real
```bash
# Update token di scripts/test-websocket-api.js dengan JWT token yang valid
node scripts/test-websocket-api.js
```

### 2. Test dengan Mock Server (Development)
```bash
# Untuk development dengan mock server
npm run test:websocket
```

## Perbedaan Utama

| Aspek | Implementasi Lama | Implementasi Baru (API Compliant) |
|-------|-------------------|-----------------------------------|
| URL | `http://localhost:3002` | `https://api.chhrone.web.id` |
| Subscription | Manual `subscribe-assessment` | Automatic `user:{userId}` room |
| Authentication | Custom format | API documented format |
| Event Structure | Custom structure | API documented structure |
| Timeout | 5 seconds | 10 seconds (as per API) |

## Next Steps

1. **Test dengan Token Real**: Ganti token di test script dengan JWT token yang valid
2. **Update Frontend Components**: Pastikan semua komponen menggunakan format event yang benar
3. **Error Handling**: Implementasikan error handling yang sesuai dengan API responses
4. **Monitoring**: Add logging untuk monitor WebSocket connection status

## Notes

- WebSocket server menggunakan Socket.IO v4.7.2
- Authentication harus dilakukan dalam 10 detik setelah connection
- User otomatis di-join ke room `user:{userId}` setelah authentication berhasil
- Tidak perlu manual subscription ke specific jobs - semua notifications untuk user akan diterima otomatis
