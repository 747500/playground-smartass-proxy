import dotenv from 'dotenv';
dotenv.config();

import { Buffer } from 'buffer';

import morgan from 'morgan';
import express from 'express';
import bodyParser from 'body-parser';
//import cookieParser from 'cookie-parser'
import axios from 'axios';

import streamJson from 'stream-json';
const { parser } = streamJson;

import Assembler from 'stream-json/Assembler.js';

import streamChain from 'stream-chain';
const { chain } = streamChain;

const app = express();
const HTTP_PORT = process.env.HTTP_PORT;

//app.use(morgan('dev'))
app.use(
  morgan(':method :url :status :response-time ms - :res[content-length]'),
);
//app.use(bodyParser.text())
app.use(express.json());
app.use(bodyParser.json());

//app.set('trust proxy', 1) // trust first proxy

function isJson(h) {
  return h['content-type'] && h['content-type'].match(/\/json/);
}

app.use((req, res, next) => {
  const headers = {};
  let body;

  console.log();
  console.log(`\tUrl:`, req.url);
  console.log(`\tQuery:`, req.query);
  console.log(`\tBody:`, req.body);

  ['cookie', 'content-length', 'content-type'].forEach((h) => {
    if (req.headers[h]) {
      headers[h] = req.headers[h];
    }
  });

  if (isJson(req.headers)) {
    body = JSON.stringify(req.body);
    headers['content-length'] = body.length;
  } else if (req.readable) {
    body = req;
  }

  const options = {
    baseURL: process.env.TARGET_BASE,
    method: req.method,
    url: req.url,
    params: req.params,
    responseType: 'stream',
    headers,
    validateStatus: (_status) => true, // do not throw http errors
  };

  if (body) {
    options.data = body;
  }

  axios
    .request(options)
    .then((targetResponse) => {
      res.statusMessage = targetResponse.statusText;
      res.status(targetResponse.status);
      res.set(targetResponse.headers);

      if (isJson(targetResponse.headers)) {
        const pipeline = chain([targetResponse.data, parser()]);
        const asm = Assembler.connectTo(pipeline);
        asm.on('done', (asm) => {
          console.log(asm.current);
          const body = Buffer.from(JSON.stringify(asm.current));
          res.setHeader('content-length', body.length);
          res.end(body);
        });

        /*
        let body;

        targetResponse.data.on('data', (data) => {
          if (undefined == body) {
            body = data;
            return;
          }

          body = Buffer.concat([body, data]);
        });

        targetResponse.data.on('end', () => {
          const parsed = JSON.parse(body.toString());
          console.log('\tres body:', parsed);
          res.setHeader('content-length', body.length);
          res.end(body);
        });
        */
        return;
      }

      targetResponse.data.pipe(res);
    })
    .catch(next);
});

const server = app
  .listen(HTTP_PORT, () => {
    console.log(`\tlistening at http://localhost:${HTTP_PORT}`);

    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Express terminated');
      });
    });
  })
  .on('error', (err) => console.error(err));
