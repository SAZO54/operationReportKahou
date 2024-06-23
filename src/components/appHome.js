export async function updateHomeTab(client, user) {
  try {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🌐 設定メニュー*'
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🐱個人設定'
            },
            action_id: 'setting'
          }
        ]
      }
    ];

    if (user === process.env.ADMIN_USER_ID) {
      blocks[1].elements.push({
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🎀投稿するチャンネルを管理する'
        },
        action_id: 'open_settings'
      });
    }

    await client.views.publish({
      user_id: user,
      view: {
        type: 'home',
        blocks: blocks
      }
    });
  } catch (error) {
    console.error('アプリホームタブの表示でエラーが発生しました:', error);
  }
};
