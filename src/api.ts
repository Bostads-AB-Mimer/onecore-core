import KoaRouter from '@koa/router'
import { routes as leaseRoutes } from './services/lease-service'
import { routes as propertyBaseRoutes } from './services/property-base-service'
import { routes as rentalPropertyRoutes } from './services/property-management-service'
import { routes as workOrderRoutes } from './services/work-order-service'

const router = new KoaRouter()

leaseRoutes(router)
propertyBaseRoutes(router)
rentalPropertyRoutes(router)
workOrderRoutes(router)

export default router
