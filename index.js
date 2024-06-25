import express from 'express';

import { retrieveData } from './src/utils/fetch.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

import logger from "./src/utils/log.js";
let log = logger(import.meta.filename);

dotenv.config();
const __dirname = import.meta.dirname;

//require('dotenv').config();
var app = express();
//var path = require('path');

//app.use(express.static(__dirname)); // Current directory is root
app.use('/media', express.static(__dirname + '/assets'));

// app.use('/update-data', async (req, res) => {
//     log.info("update data")

//     try {
//         await retrieveDataMeta();
//         res.send('done!');
//     } catch (e) {
//         log.error(e);
//         res.send('Error!')
//     }
// });

const retrieveDataMeta = async () => {
    let url = process.env.url_meta;

    try {
        let data = await retrieveData(url);
        if (data && data.data) {
            const database = await import('./src/database.js')
            await database.init(data.data);
            log.info('update success!');
        } else {
            log.info('no data');
        }
    } catch (e) {
        log.error(e);
    }
}

app.use('/healthz', (req, res) => {
    res.send('healthz');
});

app.use('/wakeup', (req, res) => {
    const meta = require('./src/login');
    meta.login();
});

app.use('/login', (req, res) => {
    app._router
    res.send('login success!');
});

app.use('/', (req, res) => {
    res.send('hello world');
});
//app.use(express.static('/assets'));

app.listen(80);
log.info('Listening on port 80');

// app = app.listen(80, function () {
//     log.info('Listening :)');
//     app.close(function () {
//         log.info("Server closed. Restarting.");
//         var server = express();
//         //server.get("/", (req, res) => testResponse(req, res));
//         server.listen(80);
//         log.info("Server is listening to port 80.");
//     });
// });

(async () => {
    const meta = await import('./src/login.js');
    await meta.login();

    // await retrieveDataMeta();
    
    const cron = await import('./src/cron/cron.js');
    cron.default(meta.client);
})();