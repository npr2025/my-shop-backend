// api/watermark.js
import fetch from 'node-fetch';
import sharp from 'sharp';

// Dropboxのウォーターマーク画像の直接ダウンロードURL（dl=1に変更済み）
const WATERMARK_URL = 'https://www.dropbox.com/scl/fi/0n2v2pg3pzvdtpve650zl/transc.png?rlkey=3eot8p6o69lu2v4ws0mkppqap&dl=1';

export default async function handler(req, res) {
  try {
    // クエリパラメータ ?url= で元画像の直接ダウンロードURL（dl=1）を受け取る
    const originalImageUrl = req.query.url;
    if (!originalImageUrl) {
      return res.status(400).json({ error: '元画像のURLが必要です。例: ?url=https://…&dl=1' });
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

    // (3) Sharpで元画像にウォーターマーク合成
    // タイル状にウォーターマーク画像を合成し、透明度0.3で重ねます
    const outputBuffer = await sharp(originalBuffer)
      .composite([{
        input: watermarkBuffer,
        tile: true,
        opacity: 0.3,
      }])
      .toBuffer();

    // (4) 出力画像をJPEG形式で返す
    res.setHeader('Content-Type', 'image/jpeg');
    return res.status(200).send(outputBuffer);

  } catch (error) {
    console.error('ウォーターマーク処理中にエラー:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}
