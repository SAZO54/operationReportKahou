export async function openUsersListModal(client: any, trigger_id: string): Promise<void> {  try {
    console.log('openUsersListModal function called');

    const userResult = await client.users.list();
    console.log("userResult", userResult);

    const channelResult = await client.conversations.list({
      types: 'public_channel,private_channel'
    });

    const channelOptions = channelResult.channels?.map((channel: any) => ({
      text: {
        type: 'plain_text',
        text: channel.name
      },
      value: channel.id
    })) || [];

    const adminUsers = userResult.members?.filter((user: any) => user.is_admin) || [];

    const adminUserBlocks = adminUsers.map((user: any) => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${user.profile?.display_name || user.real_name}*：`
      },
      accessory: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'チャンネルを選択'
        },
        options: channelOptions,
        action_id: 'channel_select'
      }
    }));

    await client.views.open({
      trigger_id: trigger_id,
      view: {
        type: 'modal',
        callback_id: 'user_list_modal',
        title: {
          type: 'plain_text',
          text: '管理者ユーザーリスト'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'ワークスペースの管理者ユーザー一覧'
            }
          },
          {
            type: 'divider'
          },
          ...adminUserBlocks
        ]
      }
    });
  } catch (error) {
    console.error('Error opening user list modal:', error);
  }
}
