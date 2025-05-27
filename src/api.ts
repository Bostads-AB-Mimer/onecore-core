import KoaRouter from '@koa/router'
import { routes as leaseRoutes } from './services/lease-service'
import { routes as rentalPropertyRoutes } from './services/property-management-service'
import { routes as workOrderRoutes } from './services/work-order-service'
import { routes as invoiceRoutes } from './services/invoice-service'
import { routes as propertyBaseRoutes } from './services/property-base-service'
import { routes as searchRoutes } from './services/search-service'
import { updateSwaggerSchemas } from './swagger'

const router = new KoaRouter()

// Register all routes
leaseRoutes(router)
rentalPropertyRoutes(router)
workOrderRoutes(router)
invoiceRoutes(router)
propertyBaseRoutes(router)
searchRoutes(router)

updateSwaggerSchemas()

export default router
