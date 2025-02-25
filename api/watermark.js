// api/watermark.js
import fetch from 'node-fetch';
import sharp from 'sharp';

// Dropboxの共有リンク（dl=1など、直接ダウンロードできる形式）
const WATERMARK_URL = 'https://www.dropbox.com/scl/fi/0n2v2pg3pzvdtpve650zl/transc.png?rlkey=3eot8p6o69lu2v4ws0mkppqap&dl=1';

export default async function handler(req, res) {
  try {
    // クエリパラメータ ?url=元画像URL
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required. Use ?url=...' });
    }

    // (1) 元画像を取得
    const originalResponse = await fetch(imageUrl);
    if (!originalResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch original image' });
    }
    const originalBuffer = await originalResponse.buffer();

    // (2) ウォーターマーク画像を取得
    const watermarkResponse = await fetch(WATERMARK_URL);
    if (!watermarkResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch watermark image' });
    }
    const watermarkBuffer = await watermarkResponse.buffer();

    // (3) Sharpで合成
    // tile: true でタイル状に繰り返し表示、opacity: 0.3 で透過度30%
    const outputBuffer = await sharp(originalBuffer)
      .composite([
        {
          input: watermarkBuffer,
          tile: true,
          opacity: 0.3,
        },
      ])
      .toBuffer();

    // (4) 加工後の画像をレスポンスとして返す
    res.setHeader('Content-Type', 'image/jpeg');
    // PNGを返したい場合は 'image/png' に変更し、 toBuffer({ format: 'png' }) など調整
    return res.status(200).send(outputBuffer);
  } catch (error) {
    console.error('Error in watermark function:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}