const QRCode = require('qrcode');
const fs = require('fs');

const ipAddress = '192.168.0.153';
const url = `exp://${ipAddress}:8081`;

console.log('\n===========================================');
console.log('   ShieldGuard - Mobile Security App    ');
console.log('===========================================\n');
console.log('URL:', url);
console.log('\nScan with Expo Go app:\n');

// Create terminal QR code
QRCode.toString(url, { type: 'terminal', small: true }, function (err, url2) {
  console.log(url2);
});

// Save as PNG image
QRCode.toFile('./assets/qrcode.png', url, {
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  width: 400
}, function(err) {
  if (err) throw err;
  console.log('\n✓ QR code saved to: assets/qrcode.png');
});

console.log('\n===========================================');
console.log('\nTo connect:');
console.log('1. Download Expo Go from App Store/Play Store');
console.log('2. Scan QR code above OR');
console.log('3. Enter URL: exp://192.168.0.153:8081');
console.log('\nNote: Phone must be on same WiFi network');
console.log('===========================================\n');