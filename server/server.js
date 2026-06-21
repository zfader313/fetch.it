const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

const keywordsPath = path.join(__dirname, 'data', 'keywords.json');
let keywordsData = {};

if (fs.existsSync(keywordsPath)) {
  keywordsData = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
  console.log('Ключевые слова загружены:', Object.keys(keywordsData));
} else {
  console.log('Файл keywords.json не найден, используется пустой список');
}

app.get('/api/search', (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ error: 'Ключевое слово не указано' });
  }
  const normalized = keyword.toLowerCase().trim();
  let urls = keywordsData[normalized] || [];
  res.json({ keyword: keyword, urls: urls, count: urls.length });
});

app.get('/api/download', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL не указан' });
  }
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Неверный формат URL' });
  }
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 5
    });
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
    response.data.pipe(res);
  } catch (error) {
    console.error('Ошибка скачивания:', error.message);
    res.status(500).json({ error: 'Не удалось скачать контент' });
  }
});

app.listen(PORT, () => {
  console.log('Сервер запущен на http://localhost:' + PORT);
});