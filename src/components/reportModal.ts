import { WebClient } from '@slack/web-api';
import { getChannels } from 'components/setting';

export async function openForm(client: WebClient, trigger_id: string, messageTs: string) {
  try {
    await client.views.open({
      trigger_id: trigger_id,
      view: {
        type: 'modal',
        callback_id: 'submit_report',
        private_metadata: JSON.stringify({ messageTs }), // ここで messageTs を保存
        title: {
          type: 'plain_text',
          text: '稼働報告の入力'
        },
        close: {
          type: 'plain_text',
          text: 'Cancel'
        },
        submit: {
          type: 'plain_text',
          text: 'Submit'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'report_block',
            element: {
              type: 'plain_text_input',
              action_id: 'report_input',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: '内容を入力する'
              }
            },
            label: {
              type: 'plain_text',
              text: '稼働報告を入力してください。'
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error opening form:', error);
  }
};
