import { getChannels } from './setting.js';

async function updateHomeTab(client, user) {
  try {
    console.log('updateHomeTab function called for user:', user);

    const channels = getChannels();
    console.log('channels:', channels);

    let channelNames = [];
    if (channels.length > 0) {
      channelNames = await Promise.all(channels.map(async function(channelId) {
        try {
          await client.conversations.join({ channel: channelId });
          const result = await client.conversations.info({ channel: channelId });
          return result.channel.name;
        } catch (error) {
          console.error('Error retrieving or joining channel info for ID ' + channelId + ':', error);
          return 'Error retrieving or joining channel info for ID ' + channelId;
        }
      }));
    }

    const channelListText = channelNames.length > 0 ? channelNames.map(function(name) {
      return '- ' + name;
    }).join('\n') : 'まだチャンネルが設定されていません。';

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🌐 設定',
          emoji: true,
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '稼働報告は、以下のチャンネルに投稿されます✨\n\n' + channelListText
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🐱 投稿するチャンネルを変更する'
            },
            action_id: 'setting'
          }
        ]
      }
    ];

    if (user === process.env.ADMIN_USER_ID) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🎀 投稿するチャンネルを管理する'
            },
            action_id: 'open_users_list'
          }
        ]
      });
    }

    const result = await client.views.publish({
      user_id: user,
      view: {
        type: 'home',
        blocks: blocks
      }
    });
    console.log('appHomeタブに送信しました:', result);
  } catch (error) {
    console.error('アプリホームタブの表示でエラーが発生しました:', error);
  }
}

export { updateHomeTab };
