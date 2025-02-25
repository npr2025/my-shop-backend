// api/watermark.js
import fetch from 'node-fetch';
import sharp from 'sharp';

// Dropboxにアップロードしたウォーターマーク画像の直接ダウンロードURL（dl=1に変更）
const WATERMARK_URL = 'https://www.dropbox.com/scl/fi/x49wen3t9pjqpbtp58o4z/hoodie-cat.png?rlkey=ncgrfypqddlqscffcp3kjdmrl&dl=1';

export default async function handler(req, res) {
  try {
    // クエリパラメータ ?url=... により、元画像のDropbox直接ダウンロードURLを受け取る
    const originalImageUrl = req.query.url;
    if (!originalImageUrl) {
      return res.status(400).json({ error: '元画像のURLが必要です。?url=... の形式で指定してください。' });
    }

    // (1) Dropboxから元画像を取得
    const originalResponse = await fetch(originalImageUrl);
    if (!originalResponse.ok) {
      return res.status(500).json({ error: '元画像の取得に失敗しました。' });
    }
    const originalBuffer = await originalResponse.buffer();

    // (2) Dropboxからウォーターマーク画像を取得
    const watermarkResponse = await fetch(WATERMARK_URL);
    if (!watermarkResponse.ok) {
      return res.status(500).json({ error: 'ウォーターマーク画像の取得に失敗しました。' });
    }
    const watermarkBuffer = await watermarkResponse.buffer();

    // (3) Sharpでウォーターマーク合成
    // この例では、ウォーターマーク画像をタイル状（fl_tiledのように繰り返し表示）に合成し、透明度 30% で重ねています
    const processedBuffer = await sharp(originalBuffer)
      .composite([{
        input: watermarkBuffer,
        tile: true,
        opacity: 0.3,
      }])
      .toBuffer();

    // (4) 加工後の画像を返す
    // ※ コンテンツタイプは元画像に合わせて設定してください（ここでは例としてJPEG）
    res.setHeader('Content-Type', 'image/jpeg');
    return res.status(200).send(processedBuffer);

  } catch (error) {
    console.error('ウォーターマーク合成エラー:', error);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
}