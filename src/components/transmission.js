import { getChannels } from './setting.js';
import { generalMessageTs, generalChannelId } from './generalReport.js';

export async function handleReportSubmission(client, { user, view }) {
  try {
    console.log('Received view:', JSON.stringify(view, null, 2)); // 追加: view オブジェクトの内容をログに出力

    const values = view.state.values;
    const report = values.report_block.report_input.value;
    const userId = user.id;
    const channels = getChannels();

    const userInfo = await client.users.info({ user: userId });
    const userName = userInfo.user.real_name || userInfo.user.name;

    // チャンネルAに投稿
    const response = await client.chat.postMessage({
      channel: channels[0],
      text: `${userName}さんの本日の稼働予定です。\n\n\`\`\`\n${report}\n\`\`\``
    });
    console.log('送信しました✨');

    // 全体報告のメッセージスレッドにリンクを追加
    await client.chat.postMessage({
      channel: generalChannelId,
      thread_ts: generalMessageTs,
      text: `${userName}さんの稼働報告: <https://${process.env.SLACK_WORKSPACE}.slack.com/archives/${channels[0]}/p${response.ts.replace('.', '')}|View Message>`
    });
    console.log('全体報告に送信しました🎉');

    const privateMetadata = JSON.parse(view.private_metadata);
    const messageTs = privateMetadata.messageTs;
    console.log('privateMetaData', privateMetadata);
    console.log('messageTs', messageTs);

    // ダイレクトメッセージ内のメッセージを更新
    const dmChannel = await client.conversations.open({ users: userId });
    const dmChannelId = dmChannel.channel.id;
    console.log('dmChannel', dmChannel);
    console.log('dmChannelId', dmChannelId);

    await client.chat.update({
      channel: dmChannelId,
      ts: messageTs,
      text: '稼働報告を行いました🎉',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '稼働報告を行いました🎉'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📮稼働報告',
              },
              action_id: 'report_activity',
              style: 'primary',
              confirm: {
                title: {
                  type: 'plain_text',
                  text: '確認'
                },
                text: {
                  type: 'mrkdwn',
                  text: 'すでに稼働報告を行いました。このボタンを再度押しますか？'
                },
                confirm: {
                  type: 'plain_text',
                  text: 'はい'
                },
                deny: {
                  type: 'plain_text',
                  text: 'いいえ'
                }
              },
              disabled: true // ボタンを無効化
            }
          ]
        }
      ]
    });

  } catch (error) {
    console.error('Error in handleReportSubmission:', error);
  }
}
