import { Context, Next } from 'koa'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import config from '../../common/config'
import { logger } from 'onecore-utilities'

interface KeycloakConfig {
  keycloakUrl: string
  clientId: string
  clientSecret: string
  realm: string
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
}

const keycloakConfig: KeycloakConfig = {
  keycloakUrl: config.auth.keycloak.url,
  clientId: config.auth.keycloak.clientId,
  clientSecret: config.auth.keycloak.clientSecret,
  realm: config.auth.keycloak.realm,
}

// JWKS client for verifying tokens
const jwksService = jwksClient({
  jwksUri: `${keycloakConfig.keycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`,
  cache: true,
  rateLimit: true,
})

// Get signing key for token verification
const getSigningKey = (kid: string) => {
  return new Promise<string>((resolve, reject) => {
    jwksService.getSigningKey(kid, (err, key) => {
      if (err) return reject(err)
      const signingKey = key.getPublicKey()
      resolve(signingKey)
    })
  })
}

// Verify JWT token
export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      throw new Error('Invalid token')
    }

    const signingKey = await getSigningKey(decoded.header.kid)
    return jwt.verify(token, signingKey)
  } catch (error) {
    logger.error('Token verification failed:', error)
    throw error
  }
}

// Exchange authorization code for tokens
export const handleTokenExchange = async (
  code: string,
  redirectUri: string
) => {
  try {
    const tokenEndpoint = `${keycloakConfig.keycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`
    
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('client_id', keycloakConfig.clientId)
    params.append('client_secret', keycloakConfig.clientSecret)
    params.append('code', code)
    params.append('redirect_uri', redirectUri)

    const response = await axios.post<TokenResponse>(tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const user = await verifyToken(response.data.access_token)
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      idToken: response.data.id_token,
      expiresIn: response.data.expires_in,
      user,
    }
  } catch (error) {
    logger.error('Token exchange failed:', error)
    throw error
  }
}

// Set authentication cookies
export const setAuthCookies = (ctx: Context, tokens: any) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: tokens.expiresIn * 1000,
  }

  ctx.cookies.set('access_token', tokens.accessToken, cookieOptions)
  ctx.cookies.set('refresh_token', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  })
}

// Clear authentication cookies
export const clearAuthCookies = (ctx: Context) => {
  ctx.cookies.set('access_token', '', { maxAge: 0 })
  ctx.cookies.set('refresh_token', '', { maxAge: 0 })
}

// Middleware to extract and verify JWT token
export const extractJwtToken = async (ctx: Context, next: Next) => {
  try {
    // Check for token in cookies first
    let token = ctx.cookies.get('access_token')
    
    // If not in cookies, check Authorization header
    if (!token) {
      const authHeader = ctx.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      ctx.status = 401
      ctx.body = { message: 'Authentication required' }
      return
    }

    // Verify the token
    const user = await verifyToken(token)
    ctx.state.user = user
    
    return next()
  } catch (error) {
    ctx.status = 401
    ctx.body = { message: 'Invalid or expired token' }
  }
}

// Generate Keycloak login URL
export const getLoginUrl = (redirectUri: string) => {
  const authEndpoint = `${keycloakConfig.keycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`
  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
  })
  
  return `${authEndpoint}?${params.toString()}`
}

// Generate Keycloak logout URL
export const getLogoutUrl = (redirectUri: string) => {
  const logoutEndpoint = `${keycloakConfig.keycloakUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`
  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: redirectUri,
  })
  
  return `${logoutEndpoint}?${params.toString()}`
}
