import fs from 'fs';

// 永続化用のファイル（JSONファイル）パス
const SETTINGS_FILE_PATH = './channel_settings.json';

let channels = loadSettings();

// 設定を永続化する関数
function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2));
}

// 設定を読み込む関数
function loadSettings() {
  if (fs.existsSync(SETTINGS_FILE_PATH)) {
    const data = fs.readFileSync(SETTINGS_FILE_PATH);
    return JSON.parse(data);
  }
  return [];
}

async function openSettings(client, trigger_id, user_id) {
  console.log('Received user_id:', user_id);

  try {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel'
    });

    const channelOptions = result.channels.map(channel => ({
      text: {
        type: 'plain_text',
        text: channel.name
      },
      value: channel.id
    }));

    const currentChannels = result.channels.filter(channel => channels.includes(channel.id)).map(channel => channel.name).join('\n');
    const initialOptions = channelOptions.filter(option => channels.includes(option.value));

    console.log('currentChannels:', currentChannels);
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
            text: '*現在投稿設定されているチャンネル*\n' + currentChannels
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
      view.blocks[2].element.initial_options = initialOptions;
    }

    await client.views.open({
      trigger_id: trigger_id,
      view: view
    });
  } catch (error) {
    console.error('Error opening settings:', error);
  }
}

async function handleSettingSubmission(view, client) {
  const selectedChannels = view.state.values.channel_select_block.channel_select.selected_options.map(option => option.value);
  channels = selectedChannels;

  saveSettings(channels);

  for (const channelId of channels) {
    try {
      await client.conversations.join({ channel: channelId });
    } catch (error) {
      console.error('Error joining channel ' + channelId + ':', error);
    }
  }
}

function getChannels() {
  return Array.isArray(channels) ? channels : [];
}

export { openSettings, handleSettingSubmission, getChannels, saveSettings };
