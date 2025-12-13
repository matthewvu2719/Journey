// Test timezone offset calculation
console.log('=== Frontend Timezone Offset Test ===');

const now = new Date();
console.log('Current local time:', now.toString());
console.log('Current UTC time:', now.toUTCString());

// This is what JavaScript returns
const jsOffset = now.getTimezoneOffset();
console.log('JavaScript getTimezoneOffset():', jsOffset, 'minutes');

// This is what we send to backend
const backendOffset = jsOffset * -1;
console.log('What we send to backend:', backendOffset, 'minutes');

// Let's verify this makes sense
console.log('\n=== Verification ===');
console.log('If local time is ahead of UTC, getTimezoneOffset() should be negative');
console.log('If local time is behind UTC, getTimezoneOffset() should be positive');

// Calculate what the backend should get
const utcNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
console.log('UTC equivalent:', utcNow.toISOString());

// Simulate backend calculation
const simulatedBackend = new Date(utcNow.getTime() + (backendOffset * 60000));
console.log('Backend should calculate:', simulatedBackend.toISOString());
console.log('Should match local time:', now.toISOString());

// Date comparison
console.log('\n=== Date Comparison ===');
console.log('Local date:', now.toLocaleDateString('en-CA'));
console.log('Backend calculated date:', simulatedBackend.toLocaleDateString('en-CA'));
console.log('Dates match:', now.toLocaleDateString('en-CA') === simulatedBackend.toLocaleDateString('en-CA'));

console.log('\n=== Day Comparison ===');
console.log('Local day:', now.toLocaleDateString('en-US', { weekday: 'short' }));
console.log('Backend calculated day:', simulatedBackend.toLocaleDateString('en-US', { weekday: 'short' }));
console.log('Days match:', now.toLocaleDateString('en-US', { weekday: 'short' }) === simulatedBackend.toLocaleDateString('en-US', { weekday: 'short' }));