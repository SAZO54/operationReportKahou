import { getChannels } from './setting.js';
import { generalMessageTs, generalChannelId } from './generalReport.js';
import { getFormattedDate } from './utils.js';

export async function handleReportSubmission(client, { user, view }) {
  try {
    console.log('Received view:', JSON.stringify(view, null, 2));

    const values = view.state.values;
    const report = values.report_block.report_input.value;
    const userId = user.id;
    const userChannels = await getChannels(userId);

    const userInfo = await client.users.info({ user: userId });
    const userName = userInfo.user.real_name || userInfo.user.name;

    if (userChannels.length === 0) {
      console.error('No channels set for user:', userId);
      return;
    }

    // チャンネルAに投稿
    const response = await client.chat.postMessage({
      channel: userChannels[0],
      text: `${userName}さんの本日の稼働予定です。\n\n\`\`\`\n${report}\n\`\`\``
    });
    console.log('送信しました✨');

    // 全体報告のメッセージスレッドにリンクを追加
    if (generalChannelId && generalMessageTs) {
      await client.chat.postMessage({
        channel: generalChannelId,
        thread_ts: generalMessageTs,
        text: `${userName}さんの稼働報告: <https://${process.env.SLACK_WORKSPACE}.slack.com/archives/${userChannels[0]}/p${response.ts.replace('.', '')}|View Message>`
      });
      console.log('全体報告に送信しました🎉');
    } else {
      console.log('全体報告の送信をスキップしました（generalChannelId または generalMessageTs が未設定）');
    }

    const privateMetadata = JSON.parse(view.private_metadata);
    const { messageTs, channel } = privateMetadata;
    console.log('privateMetadata:', privateMetadata);
    console.log('messageTs:', messageTs);
    console.log('channel:', channel);

    const formattedDate = getFormattedDate();
    const messageText = `${formattedDate}の稼働報告をお願いいたします✨\n\n稼働報告を行いました🎉`;

    // ダイレクトメッセージ内のメッセージを更新
    const dmChannel = await client.conversations.open({ users: userId });
    if (!dmChannel.ok) {
      throw new Error(`Failed to open DM channel for user ${userId}`);
    }
    const dmChannelId = dmChannel.channel.id;
    console.log('dmChannel', dmChannel);
    console.log('dmChannelId', dmChannelId);
    
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: messageText,
        },
      },
    ];
    
    const result = await client.chat.update({
      channel: dmChannelId,
      ts: messageTs,
      text: messageText,
      blocks: blocks,
    });

    console.log('DMの書き換えが完了しました🎉:', result);

  } catch (error) {
    console.error('Error in handleReportSubmission:', error);
    // エラーの詳細をログに出力
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
  }
}
