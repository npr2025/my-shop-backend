// api/watermark.js
import fetch from 'node-fetch';
import sharp from 'sharp';

// Dropboxのウォーターマーク画像（直接ダウンロード用、dl=1）
const WATERMARK_URL = 'https://www.dropbox.com/scl/fi/0n2v2pg3pzvdtpve650zl/transc.png?rlkey=3eot8p6o69lu2v4ws0mkppqap&dl=1';

export default async function handler(req, res) {
  try {
    // ?url= クエリパラメータで元画像のDropbox直接ダウンロードURLを受け取る
    const originalImageUrl = req.query.url;
    if (!originalImageUrl) {
      return res.status(400).json({ error: '元画像のURLが必要です。例: ?url=<Dropboxのdl=1リンク>' });
    }

    // (1) 元画像を取得
    const originalResponse = await fetch(originalImageUrl);
    if (!originalResponse.ok) {
      return res.status(500).json({ error: '元画像の取得に失敗しました。' });
    }
    const originalBuffer = await originalResponse.buffer();

    // (2) ウォーターマーク画像を取得
    const watermarkResponse = await fetch(WATERMARK_URL);
    if (!watermarkResponse.ok) {
      return res.status(500).json({ error: 'ウォーターマーク画像の取得に失敗しました。' });
    }
    const watermarkBuffer = await watermarkResponse.buffer();

    // (3) Sharp でウォーターマーク合成（タイル状に繰り返し、透明度0.3）
    const outputBuffer = await sharp(originalBuffer)
      .composite([{
        input: watermarkBuffer,
        tile: true,
        opacity: 0.3,
      }])
      .toBuffer();

    // (4) 加工後の画像をJPEGで返す（必要に応じてPNG等に変更）
    res.setHeader('Content-Type', 'image/jpeg');
    return res.status(200).send(outputBuffer);
  } catch (error) {
    console.error('ウォーターマーク処理中のエラー:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}
