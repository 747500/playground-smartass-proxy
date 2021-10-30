import dotenv from 'dotenv'
dotenv.config()

import morgan from 'morgan'
import express from 'express'
import axios from 'axios'

import bodyParser from 'body-parser'
//import cookieParser from 'cookie-parser'

const app = express()
const HTTP_PORT = process.env.HTTP_PORT

//app.use(morgan('dev'))
app.use(morgan(':method :url :status :response-time ms - :res[content-length]'))
//app.use(bodyParser.text())
//app.use(express.json())
//app.use(bodyParser.json())

//app.set('trust proxy', 1) // trust first proxy

app.use((req, res, next) => {
  const headers = {};

  if (req.headers.cookie) {
    headers.cookie = req.headers.cookie
  }

  if (req.headers['content-length']) {
    headers['content-length'] = req.headers['content-length']
  }

  if (req.headers['content-type']) {
    headers['content-type'] = req.headers['content-type']
  }

  const options = {
    baseURL: process.env.TARGET_BASE,
    method: req.method,
    url: req.url,
    params: req.params,
    responseType: 'stream',
    headers,
    validateStatus: (_status) => true // do not throw http errors
  }

  if (req.readable) {
    options.data = req
  }

  axios.request(options)
  .then((targetResponse) => {
    // console.log(
    //   'target response:',
    //   targetResponse.status,
    //   targetResponse.statusText,
    //   targetResponse.headers
    // )

    res.status = targetResponse.statusText
    res.statusCode = targetResponse.status

    res.set(targetResponse.headers)
    
    targetResponse.data.pipe(res)

  })
  .catch((err) => console.error(err))

})

const server = app.listen(HTTP_PORT, () => {
  console.log(`\tlistening at http://localhost:${HTTP_PORT}`)

  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Express terminated')
    })
  })
})
.on('error', (err) => console.log)
