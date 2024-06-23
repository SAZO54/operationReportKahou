import fs from 'fs';

// 永続化用のファイル（JSONファイル）パス
const SETTINGS_FILE_PATH = './channel_settings.json';

let channels = ['CHANNEL_A_ID', 'CHANNEL_B_ID'];

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
  return {};
}

let settings = loadSettings();

export async function openSettings(client, trigger_id, user_id) {
  // デバッグメッセージを追加
  console.log('Received user_id:', user_id);

  try {
    // ワークスペース内のすべてのチャンネルを取得
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

    // 現在の投稿設定されているチャンネル名を取得
    const currentChannels = result.channels.filter(channel => channels.includes(channel.id)).map(channel => channel.name).join('\n');

    // initial_optionsの作成
    const initialOptions = channelOptions.filter(option => channels.includes(option.value));

    // デバッグメッセージを追加
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

    // initial_options が空でない場合に追加
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

export async function handleSettingSubmission(view) {
  const selectedChannels = view.state.values.channel_select_block.channel_select.selected_options.map(option => option.value);
  channels = selectedChannels;

  // 設定を保存
  settings.channels = channels;
  saveSettings(settings);
}

export function getChannels() {
  return channels;
}
