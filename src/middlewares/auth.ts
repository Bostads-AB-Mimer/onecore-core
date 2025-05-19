import { Context, Next } from 'koa'
import { extractJwtToken } from '../services/auth-service/keycloak'

// Middleware to protect routes
export const requireAuth = async (ctx: Context, next: Next) => {
  try {
    await extractJwtToken(ctx, next)
  } catch (error) {
    ctx.status = 401
    ctx.body = { message: 'Authentication required' }
  }
}

// Middleware to check for specific roles
export const requireRole = (requiredRoles: string | string[]) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  
  return async (ctx: Context, next: Next) => {
    await extractJwtToken(ctx, next)
    
    const userRoles = ctx.state.user?.realm_access?.roles || []
    const hasRequiredRole = roles.some(role => userRoles.includes(role))
    
    if (!hasRequiredRole) {
      ctx.status = 403
      ctx.body = { message: 'Insufficient permissions' }
      return
    }
    
    return next()
  }
}
