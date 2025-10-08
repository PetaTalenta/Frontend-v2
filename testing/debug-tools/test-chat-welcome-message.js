/**
 * Quick test script untuk verify chat welcome message fix
 * Jalankan di Browser Console setelah membuka halaman Chat AI
 */

console.log('🧪 Starting Chat Welcome Message Test...\n');

// Test 1: Check if messages state has content
function checkMessagesState() {
  console.log('1️⃣ Checking messages state...');
  
  // Try to find chat interface in React DevTools
  const chatContainers = document.querySelectorAll('[class*="chat"]');
  console.log(`   Found ${chatContainers.length} potential chat containers`);
  
  // Check for message bubbles
  const messageBubbles = document.querySelectorAll('[class*="message"], [class*="bubble"]');
  console.log(`   Found ${messageBubbles.length} message bubbles`);
  
  if (messageBubbles.length > 0) {
    console.log('   ✅ Messages are being rendered!');
    messageBubbles.forEach((bubble, index) => {
      console.log(`   Message ${index + 1}:`, bubble.textContent.substring(0, 100) + '...');
    });
    return true;
  } else {
    console.log('   ❌ No message bubbles found');
    return false;
  }
}

// Test 2: Check localStorage
function checkLocalStorage() {
  console.log('\n2️⃣ Checking localStorage...');
  
  const chatKeys = Object.keys(localStorage).filter(key => key.includes('chat'));
  console.log(`   Found ${chatKeys.length} chat-related keys in localStorage`);
  
  chatKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data.messages && Array.isArray(data.messages)) {
        console.log(`   ✅ ${key}: ${data.messages.length} messages`);
        if (data.messages.length > 0) {
          console.log(`      First message:`, data.messages[0].content?.substring(0, 80) + '...');
        }
      } else if (typeof data === 'object') {
        console.log(`   📦 ${key}:`, Object.keys(data));
      }
    } catch (e) {
      console.log(`   ⚠️ ${key}: Invalid JSON`);
    }
  });
}

// Test 3: Check for empty state message
function checkEmptyState() {
  console.log('\n3️⃣ Checking for empty state message...');
  
  const body = document.body.textContent;
  const hasEmptyMessage = body.includes('Belum ada pesan') || body.includes('Mulai percakapan');
  
  if (hasEmptyMessage) {
    console.log('   ❌ Empty state message is visible!');
    console.log('   This means messages array is empty or not set correctly');
    return false;
  } else {
    console.log('   ✅ No empty state message found');
    return true;
  }
}

// Test 4: Inspect console logs
function checkConsoleLogs() {
  console.log('\n4️⃣ Looking for debug logs in console history...');
  console.log('   Please scroll up and look for:');
  console.log('   • 🔍 [DEBUG] Generic Endpoint Response Structure');
  console.log('   • ✅ [DEBUG] Found messages in...');
  console.log('   • 🔍 [ChatInterface] Messages from API');
  console.log('   • 📊 [DEBUG] Total welcome messages to return');
  console.log('\n   If you see these logs, copy them and share for analysis');
}

// Run all tests
async function runTests() {
  const results = {
    hasMessageBubbles: false,
    hasLocalStorageData: false,
    noEmptyState: false
  };
  
  results.hasMessageBubbles = checkMessagesState();
  checkLocalStorage();
  results.noEmptyState = checkEmptyState();
  checkConsoleLogs();
  
  console.log('\n📊 Test Results Summary:');
  console.log('   Message bubbles rendered:', results.hasMessageBubbles ? '✅ Yes' : '❌ No');
  console.log('   Empty state hidden:', results.noEmptyState ? '✅ Yes' : '❌ No');
  
  const allPassed = results.hasMessageBubbles && results.noEmptyState;
  
  if (allPassed) {
    console.log('\n🎉 SUCCESS! Welcome message is displaying correctly!');
  } else {
    console.log('\n⚠️ ISSUE DETECTED! Please share console output with developer.');
    console.log('\n💡 Quick fixes to try:');
    console.log('   1. Clear localStorage: localStorage.clear(); location.reload();');
    console.log('   2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
    console.log('   3. Clear all site data in DevTools > Application > Clear storage');
  }
  
  return allPassed;
}

// Execute
runTests();

// Export test function for re-running
window.testChatWelcomeMessage = runTests;
console.log('\n💡 Tip: Run window.testChatWelcomeMessage() to re-run tests anytime');
