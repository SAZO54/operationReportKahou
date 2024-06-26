export async function updateHomeTab(client, user) {
  try {
    console.log('updateHomeTab function called for user:', user);

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
          text: '\n'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '\n'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📮 稼働報告*'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '\n'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '稼働報告は、hogeチャンネルに投稿されます✨\n\n'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '\n'
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
      },
    ];

    if (user === process.env.ADMIN_USER_ID) {
      console.log('Admin user detected, adding admin settings button');
      // Add the new actions block for the admin button
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🎀 投稿するチャンネルを管理する'
            },
            action_id: 'open_settings'
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
};
