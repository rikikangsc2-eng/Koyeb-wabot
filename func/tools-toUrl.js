const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs').promises;
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const uploadToTelegraph = async (filePath) => {
  try {
    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('file', fileStream);

    const response = await axios.post('https://telegra.ph/upload', formData, {
      headers: formData.getHeaders(),
    });

    if (response.status === 200) {
      const mediaUrl = 'https://telegra.ph' + response.data[0].src;
      return mediaUrl;
    } else {
      throw new Error('Gagal mengunggah media ke Telegra.ph');
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
    throw error;
  }
}

const get = async (m, client) => {
  let fileExtension;
  let fileName;
  const messageType = m.mtype

  switch (messageType) {
    case 'imageMessage':
      fileExtension = 'jpeg';
      fileName = 'tmp/user.jpeg';
      break;
    case 'videoMessage':
      fileExtension = 'mp4';
      fileName = 'tmp/user.mp4';
      break;
    default:
      throw new Error('Invalid messageType');
  }

  const buffer = await downloadMediaMessage(m, 'buffer', {}, {
    reuploadRequest: client.updateMediaMessage
  });

  await writeFile(`./${fileName}`, buffer);
  const hasil = await uploadToTelegraph(fileName);
  fs.unlinkSync(fileName);

  return hasil;
}

module.exports = { get }