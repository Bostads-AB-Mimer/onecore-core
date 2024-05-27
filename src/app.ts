import Koa from 'koa'
import KoaRouter from '@koa/router'
import bodyParser from 'koa-body'
import cors from '@koa/cors'
import jwt from 'koa-jwt'
import config from './common/config'

import api from './api'
import { routes as authRoutes } from './services/auth-service'
import { routes as healthRoutes } from './services/health-service'

import logger from './common/logger'

const app = new Koa()

app.use(cors())

app.on('error', (err) => {
  logger.error(err)
})

app.use(bodyParser())
app.use((ctx, next) => {
  logger.info(
    {
      request: {
        path: ctx.path,
        user: ctx.state?.user,
        status: ctx.status,
      },
    },
    'Incoming request',
    ctx
  )
  return next()
})

const publicRouter = new KoaRouter()

authRoutes(publicRouter)
healthRoutes(publicRouter)
app.use(publicRouter.routes())

app.use(jwt({ secret: config.auth.secret }))

app.use(api.routes())

export default app
