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
  const messageTs = body.message.ts;
  await reportOpenForm(client, body.trigger_id, messageTs);
});

app.action('setting', async ({ ack, body, client }) => {
  await ack();
  await openSettings(client, body.trigger_id, body.user.id);
});

app.action('open_settings', async ({ ack, body, client }) => {
  await ack();
  await openSettings(client, body.trigger_id, body.user.id);
});

app.view('submit_report', async ({ ack, body, view, client }) => {
  await ack();
  await handleReportSubmission(client, { user: body.user, view });
});

app.view('submit_setting', async ({ ack, body, view, client }) => {
  await ack();
  await handleSettingSubmission(view);
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');

  scheduleReport(app);
})();
