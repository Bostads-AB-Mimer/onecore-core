import KoaRouter from '@koa/router'
import config from '../../common/config'
import { healthCheck as odooHealthCheck } from '../ticketing-service/adapters/odoo-adapter'
import {
  loggedAxios as axios,
  setAxiosExclusionFilters,
} from 'onecore-utilities'
import { SystemHealth } from 'onecore-types'

setAxiosExclusionFilters([/.*?\/health$/])

const oneCoreServiceProbe = async (
  systemName: string,
  systemUrl: string
): Promise<SystemHealth> => {
  try {
    const result = await axios(systemUrl)

    if (result.status === 200) {
      return result.data
    } else {
      return {
        name: systemName,
        status: 'failure',
        statusMessage: result.data,
      }
    }
  } catch (error: any) {
    return {
      name: systemName,
      status: 'failure',
      statusMessage: error.message,
    }
  }
}

const subsystems = [
  {
    probe: async (): Promise<SystemHealth> => {
      return await oneCoreServiceProbe(
        'leasing',
        config.tenantsLeasesService.url + '/health'
      )
    },
  },
  {
    probe: async (): Promise<SystemHealth> => {
      return await oneCoreServiceProbe(
        'property-management',
        config.propertyInfoService.url + '/health'
      )
    },
  },
  {
    probe: async (): Promise<SystemHealth> => {
      return await oneCoreServiceProbe(
        'communication',
        config.communicationService.url + '/health'
      )
    },
  },
  {
    probe: async (): Promise<SystemHealth> => {
      try {
        await odooHealthCheck()
        return {
          name: 'odoo',
          status: 'active',
        }
      } catch (error: any) {
        return {
          name: 'odoo',
          status: 'failure',
          statusMessage: error.message || 'Failed to access odoo.',
        }
      }
    },
  },
]

export const routes = (router: KoaRouter) => {
  router.get('(.*)/health', async (ctx) => {
    const health: SystemHealth = {
      name: 'core',
      status: 'active',
      subsystems: [],
    }

    // Iterate over subsystems
    for (const subsystem of subsystems) {
      const subsystemHealth = await subsystem.probe()
      health.subsystems?.push(subsystemHealth)

      switch (subsystemHealth.status) {
        case 'failure':
          health.status = 'failure'
          health.statusMessage = 'Failure because of failing subsystem(s)'
          break
        case 'impaired':
          if (health.status !== 'failure') {
            health.status = 'impaired'
            health.statusMessage = 'Failure because of impaired subsystem(s)'
          }
          break
        case 'unknown':
          if (health.status !== 'failure' && health.status !== 'impaired') {
            health.status = 'unknown'
            health.statusMessage =
              'Unknown because subsystem(s) status is unknown'
          }
          break
        default:
          break
      }
    }

    ctx.body = health
  })
}
