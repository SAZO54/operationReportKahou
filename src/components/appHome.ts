import { getChannelSettings, getUserSettings } from 'components/setting';

export async function updateHomeTab(client: any, user: string): Promise<void> {
  try {
    console.log('updateHomeTab function called for user:', user);

    const channels = await getChannelSettings(user);
    const channelNames = channels.map(channel => channel.name).join('\n');
    const userSettings = await getUserSettings(user);

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🌐 設定',
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📮 稼働報告*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `稼働報告は、以下のチャンネルに投稿されます✨\n${channelNames}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🐱 投稿するチャンネルを変更する',
            },
            action_id: 'setting',
          },
        ],
      },
    ];

    if (user === process.env.ADMIN_USER_ID) {
      console.log('Admin user detected, adding admin settings button');
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🎀 投稿するチャンネルを管理する',
            },
            action_id: 'open_users_list',
          },
        ],
      });
    }

    const result = await client.views.publish({
      user_id: user,
      view: {
        type: 'home',
        blocks: blocks,
      },
    });
    console.log('appHomeタブに送信しました:', result);
  } catch (error) {
    console.error('アプリホームタブの表示でエラーが発生しました:', error);
  }
}
