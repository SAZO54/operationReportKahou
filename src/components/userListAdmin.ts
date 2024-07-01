export async function openUserListModal(client: any, trigger_id: string): Promise<void> {
  try {
    const usersResponse = await client.users.list();
    const users = usersResponse.members.filter((user: any) => !user.is_bot && !user.deleted);

    const blocks = users.map((user: any) => ({
      type: 'section',
      block_id: `user_${user.id}`,
      text: {
        type: 'mrkdwn',
        text: `${user.real_name}`
      },
      accessory: {
        type: 'channels_select',
        placeholder: {
          type: 'plain_text',
          text: 'Select a channel',
          emoji: true
        },
        action_id: `channel_select_${user.id}`
      }
    }));

    await client.views.open({
      trigger_id: trigger_id,
      view: {
        type: 'modal',
        callback_id: 'submit_user_channels',
        title: {
          type: 'plain_text',
          text: 'チャンネル設定',
          emoji: true
        },
        submit: {
          type: 'plain_text',
          text: '保存',
          emoji: true
        },
        blocks: blocks
      }
    });
  } catch (error) {
    console.error('Error opening user list modal:', error);
  }
}

export async function handleUserListSubmission(view: any): Promise<string> {
  const values = view.state.values;
  const channelListText = Object.keys(values).map(key => {
    const user = key.split('_')[1];
    const channel = values[key][`channel_select_${user}`].selected_channel;
    return `ユーザー: ${user}, チャンネル: ${channel}`;
  }).join('\n');

  // 保存するロジックを実装
  return channelListText;
}
