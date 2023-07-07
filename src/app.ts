import Koa from 'koa'
import KoaRouter from '@koa/router'
import bodyParser from 'koa-body'
import cors from '@koa/cors'
import jwt from 'koa-jwt'
import config from './common/config'

import api from './api'
import { routes as authRoutes } from './services/auth-service'
import errorHandler from './middlewares/error-handler'

const app = new Koa()

app.use(cors())

app.on('error', (err) => {
  console.error(err)
})

app.use(errorHandler())

app.use(bodyParser())

const publicRouter = new KoaRouter()

authRoutes(publicRouter)
app.use(publicRouter.routes())

app.use(jwt({ secret: config.auth.secret }))

app.use(api.routes())

export default app
