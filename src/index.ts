import app from './app'
import config from './common/config'
import { logger } from 'onecore-utilities'

const PORT = config.port || 5010
const server = app.listen(PORT, () => {
  logger.info(`listening on http://localhost:${PORT}`)
  logger.info(`Keycloak URL: ${config.auth.keycloak.url}/realms/${config.auth.keycloak.realm}`)
  logger.info(`Keycloak Client ID: ${config.auth.keycloak.clientId}`)
})
server.setTimeout(0)
server.requestTimeout = 0
server.keepAliveTimeout = 0
server.timeout = 0
