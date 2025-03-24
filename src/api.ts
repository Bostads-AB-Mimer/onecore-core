import KoaRouter from '@koa/router'
import { routes as leaseRoutes } from './services/lease-service'
import { routes as rentalPropertyRoutes } from './services/property-management-service'
import { routes as workOrderRoutes } from './services/work-order-service'
import { routes as searchRoutes } from './services/search-service'

const router = new KoaRouter()

leaseRoutes(router)
rentalPropertyRoutes(router)
workOrderRoutes(router)
searchRoutes(router)

export default router
