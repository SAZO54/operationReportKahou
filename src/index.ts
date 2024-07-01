import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pkg from '@slack/bolt';
import { updateHomeTab } from './components/appHome';
import { openForm as reportOpenForm } from './components/reportModal';
import { openSettings, handleSettingSubmission } from './components/setting';
import { handleReportSubmission } from './components/transmission';
import { scheduleReport } from './components/generalReport';
import { openUsersListModal} from './components/usersListModal';
import { postDailyReportMessage } from './components/appMessage';

const { App } = pkg;
dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN, 
  socketMode: true,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

export { app };

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

app.event('app_home_opened', async ({ event, client }) => {
  console.log('app_home_opened event received for user:', event.user);
  await updateHomeTab(client, event.user);
});

app.event('reaction_added', async ({ event, client }) => {
  console.log('Reaction added event received:', event);
  if (event.reaction === '出勤') {
    console.log('出勤 reaction detected');
    const messageTs = await postDailyReportMessage(client, event.user);
    console.log('Message timestamp:', messageTs);
  }
});

app.action('report_activity', async ({ ack, body, client }) => {
  await ack();
  const messageTs = (body as any).message.ts;
  await reportOpenForm(client, (body as any).trigger_id, messageTs);
});

app.action('setting', async ({ ack, body, client }) => {
  await ack();
  await openSettings(client, (body as any).trigger_id, body.user.id);
});

app.action('open_settings', async ({ ack, body, client }) => {
  await ack();
  await openSettings(client, (body as any).trigger_id, body.user.id);
});

app.action('open_users_list', async ({ ack, body, client }) => {
  await ack();
  await openUsersListModal(client, (body as any).trigger_id);
});

app.view('submit_report', async ({ ack, body, view, client }) => {
  await ack();
  await handleReportSubmission(client, { user: body.user, view });
});

app.view('submit_setting', async ({ ack, body, view, client }) => {
  await ack();
  await handleSettingSubmission(view, client);
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');

  // 手動でホームタブを更新
  const testUserId = process.env.ADMIN_USER_ID; // 確認用に管理者のユーザーIDを使用
  if (testUserId) {
    await updateHomeTab(app.client, testUserId);
  } else {
    console.error('ADMIN_USER_ID is not set in .env');
  }

  scheduleReport(app);
})();
