import mysql from 'mysql2/promise';
import pool from './db';

interface Channel {
  id: string;
  name: string;
}

export async function saveChannelSettings(userId: string, channels: Channel[]): Promise<void> {
  const connection = await pool.getConnection();
  const insertQuery = 'INSERT INTO user_channels (user_id, channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id)';
  const deleteQuery = 'DELETE FROM user_channels WHERE user_id = ? AND channel_id NOT IN (?)';

  try {
    await connection.beginTransaction();

    // Save channels
    for (const channel of channels) {
      await connection.execute(insertQuery, [userId, channel.id]);
    }

    // Remove channels not in the provided list
    const channelIds = channels.map(channel => channel.id).join(',');
    await connection.execute(deleteQuery, [userId, channelIds]);

    await connection.commit();
    console.log('チャンネル情報を保存しました');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function saveUserSettings(userId: string, baseName: string): Promise<void> {
  const connection = await pool.getConnection();
  const query = 'INSERT INTO user_settings (user_id, base_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE base_name = VALUES(base_name), change_time = CURRENT_TIMESTAMP';

  try {
    await connection.execute(query, [userId, baseName]);
    console.log('ユーザー設定を保存しました');
  } finally {
    connection.release();
  }
}

export async function getChannelSettings(userId: string): Promise<Channel[]> {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute('SELECT channel_id AS id FROM user_channels WHERE user_id = ?', [userId]);

  connection.release();
  return rows as Channel[];
}

export async function getUserSettings(userId: string): Promise<{ base_name: string; change_time: string } | undefined> {
  const connection = await pool.getConnection();
  const [rows] = await connection.execute('SELECT base_name, change_time FROM user_settings WHERE user_id = ?', [userId]);

  connection.release();
  const result = rows as { base_name: string; change_time: string }[];
  return result.length > 0 ? result[0] : undefined;
}

export async function getChannels(userId: string): Promise<Channel[]> {
  return await getChannelSettings(userId);
}

export async function openSettings(client: any, trigger_id: string, user_id: string): Promise<void> {
  console.log('Received user_id:', user_id);

  try {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel'
    });

    const channelOptions = result.channels.map((channel: any) => ({
      text: {
        type: 'plain_text',
        text: channel.name
      },
      value: channel.id
    }));

    const currentChannels = await getChannelSettings(user_id);
    const currentChannelNames = currentChannels.map(channel => channel.name).join('\n');
    const initialOptions = channelOptions.filter((option: any) => currentChannels.map(c => c.id).includes(option.value));

    const userSettings = await getUserSettings(user_id);

    console.log('currentChannels:', currentChannelNames);
    console.log('initialOptions:', initialOptions);

    const view = {
      type: 'modal',
      callback_id: 'submit_setting',
      title: {
        type: 'plain_text',
        text: '🐱設定'
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*現在投稿設定されているチャンネル*\n' + currentChannelNames
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'input',
          block_id: 'channel_select_block',
          element: {
            type: 'multi_static_select',
            action_id: 'channel_select',
            placeholder: {
              type: 'plain_text',
              text: 'チャンネルを選択'
            },
            options: channelOptions
          },
          label: {
            type: 'plain_text',
            text: '稼働報告を送信するチャンネルを再選択する'
          }
        },
        {
          type: 'input',
          block_id: 'base_name_block',
          element: {
            type: 'plain_text_input',
            action_id: 'base_name_input',
            initial_value: userSettings ? userSettings.base_name : ''
          },
          label: {
            type: 'plain_text',
            text: 'Base Name'
          }
        }
      ],
      close: {
        type: 'plain_text',
        text: 'Cancel'
      },
      submit: {
        type: 'plain_text',
        text: 'Submit'
      }
    };

    if (initialOptions.length > 0) {
      (view.blocks[2].element as any).initial_options = initialOptions;
    }

    await client.views.open({
      trigger_id: trigger_id,
      view: view
    });
  } catch (error) {
    console.error('Error opening settings:', error);
  }
}

export async function handleSettingSubmission(view: any, client: any): Promise<void> {
  const selectedChannels = view.state.values.channel_select_block.channel_select.selected_options.map((option: any) => option.value);
  const baseName = view.state.values.base_name_block.base_name_input.value;

  const channelData = selectedChannels.map((id: string) => ({
    id: id,
    name: view.state.values.channel_select_block.channel_select.selected_options.find((option: any) => option.value === id).text.text
  }));

  await saveChannelSettings(view.user.id, channelData);
  await saveUserSettings(view.user.id, baseName);

  for (const channelId of selectedChannels) {
    try {
      await client.conversations.join({ channel: channelId });
    } catch (error) {
      console.error('Error joining channel ' + channelId + ':', error);
    }
  }
}
