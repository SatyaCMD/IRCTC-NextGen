const fs = require('fs');
const https = require('https');

const options = {
  hostname: 'upload.wikimedia.org',
  path: '/wikipedia/en/thumb/4/45/IRCTC_Logo.svg/240px-IRCTC_Logo.svg.png',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

https.get(options, (res) => {
  const filePath = fs.createWriteStream('client/src/app/icon.png');
  res.pipe(filePath);
  filePath.on('finish', () => {
    filePath.close();
    console.log('PNG Icon downloaded successfully with User-Agent');
  });
}).on('error', (e) => {
  console.error(e);
});
