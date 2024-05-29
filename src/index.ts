import app from './app'
import Config from './common/config'
import { logger } from 'onecore-utilities'

const PORT = Config.port || 5010
app.listen(PORT, () => {
  logger.info(`listening on http://localhost:${PORT}`)
})
