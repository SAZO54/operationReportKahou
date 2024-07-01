import { WebClient } from '@slack/web-api';
import { getChannels } from 'components/setting';
import { generalMessageTs, generalChannelId } from 'components/generalReport';
import { getFormattedDate } from 'components/utils';

export async function handleReportSubmission(client: WebClient, { user, view }: { user: any, view: any }) {
  try {
    console.log('Received view:', JSON.stringify(view, null, 2));

    const values = view.state.values;
    const report = values.report_block.report_input.value;
    const userId = user.id;
    const channels = await getChannels(userId);

    if (!channels.length) {
      throw new Error('No channels found for the user.');
    }

    const userInfo = await client.users.info({ user: userId });
    const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown User';

    const response = await client.chat.postMessage({
      channel: channels[0].id,
      text: `${userName}さんの本日の稼働予定です。\n\n\`\`\`\n${report}\n\`\`\``
    });
    console.log('送信しました✨');

    if (!response.ts) {
      throw new Error('No timestamp returned from Slack.');
    }

    await client.chat.postMessage({
      channel: generalChannelId,
      thread_ts: generalMessageTs,
      text: `${userName}さんの稼働報告: <https://${process.env.SLACK_WORKSPACE}.slack.com/archives/${channels[0].id}/p${response.ts.replace('.', '')}|View Message>`
    });
    console.log('全体報告に送信しました🎉');

    const privateMetadata = JSON.parse(view.private_metadata);
    const messageTs = privateMetadata.messageTs;
    console.log('privateMetaData', privateMetadata);
    console.log('messageTs', messageTs);
    const formattedDate = getFormattedDate();
    const messageText = `${formattedDate}の稼働報告をお願いいたします✨\n\n稼働報告を行いました🎉`;

    const dmChannel = await client.conversations.open({ users: userId });
    if (!dmChannel.ok) {
      throw new Error(`Failed to open DM channel for user ${userId}`);
    }
    const dmChannelId = dmChannel.channel?.id;
    if (!dmChannelId) {
      throw new Error(`Failed to get DM channel ID for user ${userId}`);
    }

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
  }
}
