import { WebClient } from '@slack/web-api';
import schedule from 'node-schedule';
import { getFormattedDate } from 'components/utils';

let generalMessageTs: string | undefined;
const generalChannelId = 'C04GLB9K6HH';

// 毎週月～金 07:00にメッセージ投稿
function scheduleReport(app: { client: WebClient }) {
  const rule = new schedule.RecurrenceRule();
  // rule.dayOfWeek = [new schedule.Range(1, 5)]; // 平日のみ
  rule.tz = 'Asia/Tokyo';
  rule.hour = 8; // テスト用に16時に設定
  rule.minute = 2; // テスト用に2分に設定

  schedule.scheduleJob(rule, async function() {
    const formattedDate = getFormattedDate();
    const messageText = `おはようございます🌞\n${formattedDate}の全体報告スレッドです📝\n今日も一日よろしくお願いします✨`;

    try {
      const result = await app.client.chat.postMessage({
        channel: generalChannelId,
        text: messageText
      });
      generalMessageTs = result.ts;
      console.log('全体報告を開始しました✨:', result.ts);
    } catch (error) {
      console.error('Error message:', error);
    }
  });
}

export { scheduleReport, generalMessageTs, generalChannelId };
