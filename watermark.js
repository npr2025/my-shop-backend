import fetch from 'node-fetch';
import sharp from 'sharp';

// Dropboxのウォーターマーク画像の直接ダウンロードリンク（dl=1）
const WATERMARK_URL = 
'https://www.dropbox.com/scl/fi/0n2v2pg3pzvdtpve650zl/transc.png?rlkey=3eot8p6o69lu2v4ws0mkppqap&dl=1';

export default async function handler(req, res) {
  try {
    // クエリパラメータ ?url=元画像のURL を利用
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required. Use 
?url=...' });
    }

    // 元画像を取得
    const originalResponse = await fetch(imageUrl);
    if (!originalResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch original 
image' });
    }
    const originalBuffer = await originalResponse.buffer();

    // ウォーターマーク画像を取得
    const watermarkResponse = await fetch(WATERMARK_URL);
    if (!watermarkResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch watermark 
image' });
    }
    const watermarkBuffer = await watermarkResponse.buffer();

    // Sharpでタイル状にウォーターマーク合成（opacity: 0.3）
    const outputBuffer = await sharp(originalBuffer)
      .composite([{
        input: watermarkBuffer,
        tile: true,
        opacity: 0.3,
      }])
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    return res.status(200).send(outputBuffer);

  } catch (error) {
    console.error('Error in watermark function:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

