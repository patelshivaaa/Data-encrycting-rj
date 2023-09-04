const socket = require('socket.io-client')('http://localhost:3001'); // Update with listener's URL
const crypto = require('crypto');
const data = require('../data.json');

function generateSecretKey(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(16); // Initialization Vector
  const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(key, 'hex'), iv); // Convert key to Buffer
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
  };
}

function generateEncryptedMessage(data) {
    const encryptedData = encrypt(JSON.stringify(data), data.secret_key);
    return encryptedData;
  }

function generateRandomData() {
  const randomName = data.names[Math.floor(Math.random() * data.names.length)];
  const randomOrigin = data.cities[Math.floor(Math.random() * data.cities.length)];
  const randomDestination = data.cities[Math.floor(Math.random() * data.cities.length)];
  
  const randomEntry = {
    name: randomName,
    origin: randomOrigin,
    destination: randomDestination
  };
  
  return {
    ...randomEntry,
    secret_key: generateSecretKey(randomEntry)
  };
}

function generateAndSendData() {
  const numMessages = Math.floor(Math.random() * (499 - 49 + 1)) + 49;

  for (let i = 0; i < numMessages; i++) {
    const randomData = generateRandomData();
    const encryptedMessage = generateEncryptedMessage(randomData);

    socket.emit('encryptedData', {
      encryptedMessage: encryptedMessage,
      decryptionKey: randomData.secret_key, // Send the decryption key
    });
  }
}

socket.on('connect', () => {
  console.log('Connected to server');
  setInterval(generateAndSendData, 10000);
});

module.exports = {
    generateSecretKey
}