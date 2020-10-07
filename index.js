const express = require('express');
const bodyParser = require('body-parser');
const yup = require('yup');
const { v4 } = require('uuid');
const Agenda = require('agenda');
const api = express();

const port = process.env.PORT;
const addr = '0.0.0.0';
const appId = v4();

const mongoConnectionString = 'mongodb://127.0.0.1:27017/agenda';
const agenda = new Agenda({db: {address: mongoConnectionString}});

(async () => {
  await agenda.start();
})();

api.use(bodyParser.json());

async function validateSchedule(schedule) {
  const scheduleValidator = yup.object().shape({
    name: yup.string().required(),
    schedule: yup.string().required(),
    description: yup.string(),
  });

  return scheduleValidator.validate(schedule);
}

agenda.define('get_time', async () => {
  console.log(`[${appId} - ${Date.now()}] TIME:${new Date()}`);
});

agenda.define('get_pid', async () => {
  console.log(`[${appId} - ${Date.now()}] PID:${process.pid}`);
});

agenda.define('get_cwd', async () => {
  console.log(`[${appId} - ${Date.now()}] CWD:${process.cwd()}`);
});

api.post('/schedule', async (req, res) => {
  const { body } = req;

  console.log(`[${appId} - ${Date.now()}] - Job ${body.name} scheduled!`);
  await agenda.every(body.schedule, body.name, body.data);

  res.status(201);
  return res.json({ ok: true });
})

api.delete('/schedule/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await agenda.cancel({ name: id });
  } catch(err) {
    throw new Error(`Could not cancel job of id ${id}`);
  }

  console.log(`[${appId}] - Job ${id} canceled!`);

  res.status(204);
  res.send();
});

api.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }

  console.error('well...');
  console.error(err);

  res.status(500);

  const returnObject = {
    error: error.message
  };

  if (err.stack) {
    returnObject.stack = err.stack;
  }

  res.json(returnObject);
});

api.listen(port, addr, () => console.log('server is running!'));
