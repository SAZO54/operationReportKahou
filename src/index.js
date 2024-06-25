import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pkg from '@slack/bolt';
import { updateHomeTab } from './components/appHome.js';
import { openForm as reportOpenForm } from './components/reportModal.js';
import { openSettings, handleSettingSubmission } from './components/setting.js';
import { handleReportSubmission } from './components/transmission.js';
import scheduleReport from './components/generalReport.js';
import { postDailyReportMessage } from './components/appMessage.js';
import { openUsersListModal, handleUserListModalSubmission } from './components/usersListModal.js';

const { App } = pkg;
dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN, 
  socketMode: true,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

app.event('app_home_opened', async function({ event, client }) {
  console.log('app_home_opened event received for user:', event.user);
  await updateHomeTab(client, event.user);
});

app.event('reaction_added', async function({ event, client }) {
  console.log('Reaction added event received:', event);
  if (event.reaction === '出勤') {
    console.log('出勤 reaction detected');
    const messageTs = await postDailyReportMessage(client, event.user);
    console.log('Message timestamp:', messageTs);
  }
});

app.action('report_activity', async function({ ack, body, client }) {
  await ack();
  const messageTs = body.message.ts;
  await reportOpenForm(client, body.trigger_id, messageTs);
});

app.action('setting', async function({ ack, body, client }) {
  await ack();
  await openSettings(client, body.trigger_id, body.user.id);
});

app.action('open_users_list', async function({ ack, body, client }) {
  await ack();
  await openUsersListModal(client, body.trigger_id);
});

app.view('submit_report', async function({ ack, body, view, client }) {
  await ack();
  await handleReportSubmission(client, { user: body.user, view });
});

app.view('submit_setting', async function({ ack, body, view, client }) {
  await ack();
  await handleSettingSubmission(view, client);
});

app.view('user_list_modal', async function({ ack, body, view, client }) {
  await ack();
  await handleUserListModalSubmission(view, client);
});

(async function() {
  await app.start();
  console.log('⚡️ Bolt app is running!');

  // 手動でホームタブを更新
  const testUserId = process.env.ADMIN_USER_ID; // 確認用に管理者のユーザーIDを使用
  await updateHomeTab(app.client, testUserId);

  scheduleReport(app);
})();
