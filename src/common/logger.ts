import pino from 'pino'
import pinoElastic from 'pino-elasticsearch'
import { multistream } from 'pino-multi-stream'
import pretty from 'pino-pretty'

const streamToElastic = pinoElastic({
  index: 'onecore-logging',
  node: 'http://localhost:9200',
  esVersion: 8,
  flushBytes: 100,
  flushInterval: 1000,
})

streamToElastic.on('error', (error) => console.log(error))
streamToElastic.on('insertError', (error) => console.log(error))

const prettyStream = pretty({
  colorize: true,
  ignore: 'application,request',
  singleLine: true,
  messageFormat: '{msg} {request.path} {request.status} {request.user}',
})

const pinoOptions = {}

const logger = pino(
  pinoOptions,
  multistream([{ stream: prettyStream }, { stream: streamToElastic }])
).child({ application: { name: 'core', environment: process.env.NODE_ENV } })

export default logger
