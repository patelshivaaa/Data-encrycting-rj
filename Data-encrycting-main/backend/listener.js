const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { generateSecretKey } = require('./emitter'); // Import generateSecretKey function

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const mongoURI = 'mongodb://127.0.0.1:27017/encrypted_timeseries'; // Update as needed
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error(err);
});

const DataEntry = mongoose.model('DataEntry', new mongoose.Schema({
  name: String,
  origin: String,
  destination: String,
  secret_key: String,
  timestamp: { type: Date, default: Date.now }
}));

function decrypt(data, key) {
  const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(key, 'hex'), Buffer.from(data.iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data.encryptedData, 'hex')), decipher.final()]);
  return decrypted.toString();
}

io.on('connection', (socket) => {
  console.log('Socket connected');

  socket.on('encryptedData', (data) => {
    const encryptedMessage = data.encryptedMessage;
    const decryptionKey = data.decryptionKey; // Extract the decryption key

    try {
      const decryptedMessage = decrypt(encryptedMessage, decryptionKey);
      const messageData = JSON.parse(decryptedMessage);

      const { name, origin, destination, secret_key } = messageData;

      // Validate the secret_key
      const calculatedKey = generateSecretKey({ name, origin, destination });
      if (secret_key === calculatedKey) {
        const dataEntry = new DataEntry({
          name,
          origin,
          destination,
          secret_key
        });

        // dataEntry.save((err, savedEntry) => {
        //   if (err) {
        //     console.error(err);
        //   } else {
        //     console.log('Data saved:', savedEntry);
        //   }
        // });
        dataEntry.save().then((savedEntry) => {
          console.log('Data saved:', savedEntry);
        }).catch((err) => {
          console.error(err);
        });
      } else {
        console.log('Data integrity compromised:', messageData);
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
});

server.listen(3001, () => {
  console.log('Listener service started on port 3001');
});
