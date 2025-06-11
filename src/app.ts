import Koa from 'koa'
import KoaRouter from '@koa/router'
import bodyParser from 'koa-body'
import cors from '@koa/cors'
import jwt from 'koa-jwt'
import config from './common/config'

import api from './api'
import { routes as authRoutes } from './services/auth-service'
import { routes as healthRoutes } from './services/health-service'

import { logger, loggerMiddlewares } from 'onecore-utilities'
import { koaSwagger } from 'koa2-swagger-ui'
import { routes as swagggerRoutes } from './services/swagger'
import { requireAuth } from './middlewares/keycloak-auth'

const app = new Koa()

app.use(
  cors({
    credentials: true,
    origin: (ctx) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://your-production-domain.com',
      ]
      const origin = ctx.request.headers.origin
      if (origin && allowedOrigins.includes(origin)) {
        return origin
      }
      return allowedOrigins[0]
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
)

app.use(
  koaSwagger({
    routePrefix: '/swagger',
    swaggerOptions: {
      url: '/swagger.json',
    },
  })
)

app.on('error', (err) => {
  logger.error(err)
})

app.use(bodyParser({ multipart: true }))

// Log the start and completion of all incoming requests
app.use(loggerMiddlewares.pre)
app.use(loggerMiddlewares.post)

const publicRouter = new KoaRouter()

authRoutes(publicRouter)
healthRoutes(publicRouter)
swagggerRoutes(publicRouter)
app.use(publicRouter.routes())

// JWT middleware with multiple options
app.use((ctx, next) => {
  if (ctx.cookies.get('auth_token') === undefined) {
    return jwt({
      secret: config.auth.secret,
    })(ctx, next)
  }

  return requireAuth(ctx, next)
})

app.use(api.routes())

export default app
