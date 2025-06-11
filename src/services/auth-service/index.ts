import KoaRouter from '@koa/router'
import createHttpError from 'http-errors'
import { logger } from 'onecore-utilities'

import hash from './hash'
import { createToken } from './jwt'
import auth from './keycloak'

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 */
export const routes = (router: KoaRouter) => {
  /**
   * @swagger
   * /auth/generatehash:
   *  get:
   *    summary: Generates a salt and hashes the given password using that salt.
   *    description: Generates a salt and hashes the given password using that salt. Pass cleartext password as query parameter.
   *    tags:
   *      - Auth
   *    parameters:
   *      - in: query
   *        name: password
   *        required: true
   *        type: string
   *        description: The cleartext password that should be hashed
   *    responses:
   *      '200':
   *        description: 'Hashed password and salt'
   *        schema:
   *            type: object
   *            properties:
   *              passwordHash:
   *                type: string
   *              salt:
   *                type: string
   */
  router.get('(.*)/auth/generatehash', async (ctx) => {
    const { query } = ctx

    if (!query.password) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter: password' }
      return
    }

    const saltAndHash = await hash.createSaltAndHash(query.password as string)
    ctx.body = saltAndHash
  })

  /**
   * @swagger
   * /auth/generatetoken:
   *   post:
   *     summary: Generates a JWT token
   *     description: Validates username and password from request body and returns a JWT token.
   *     tags:
   *       - Auth
   *     requestBody:
   *       required: true
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       '200':
   *         description: A valid JWT token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *       '400':
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 errorMessage:
   *                   type: string
   *       '500':
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  router.post('(.*)/auth/generatetoken', async (ctx) => {
    const username = ctx.request.body?.username as string
    const password = ctx.request.body?.password as string

    if (!username || !password) {
      ctx.status = 400
      ctx.body = { errorMessage: 'Missing parameter(s): username, password' }
      return
    }

    try {
      const token = await createToken(username, password)
      ctx.body = token
    } catch (error) {
      if (createHttpError.isHttpError(error)) {
        ctx.status = (error as createHttpError.HttpError).statusCode
        ctx.body = { message: (error as createHttpError.HttpError).message }
      } else {
        ctx.status = 500
        ctx.body = { message: (error as Error).message }
      }
    }
  })

  /**
   * @swagger
   * /auth/login:
   *   get:
   *     summary: Redirects to Keycloak login
   *     description: Redirects the user to the Keycloak login page
   *     tags:
   *       - Auth
   *     responses:
   *       '302':
   *         description: Redirect to Keycloak login
   */
  router.get('(.*)/auth/login', async (ctx) => {
    const redirectUri = `${ctx.protocol}://${ctx.host}/auth/callback`
    const keycloakLoginUrl = `${auth.keycloakUrl}/protocol/openid-connect/auth?client_id=${auth.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`

    ctx.redirect(keycloakLoginUrl)
  })

  /**
   * @swagger
   * /auth/callback:
   *   get:
   *     summary: OAuth callback endpoint
   *     description: Handles the OAuth callback from Keycloak
   *     tags:
   *       - Auth
   *     parameters:
   *       - in: query
   *         name: code
   *         required: true
   *         type: string
   *         description: Authorization code from Keycloak
   *     responses:
   *       '302':
   *         description: Redirect to dashboard on success
   */
  router.get('(.*)/auth/callback', async (ctx) => {
    try {
      const { code } = ctx.query
      if (!code || typeof code !== 'string') {
        throw new Error('Missing authorization code')
      }

      const redirectUri = `${ctx.protocol}://${ctx.host}/auth/callback`

      // Exchange code for tokens and set cookies
      const { user } = await auth.handleTokenExchange(
        code,
        redirectUri,
        ctx.response
      )

      ctx.body = user
    } catch (error) {
      logger.error('Authentication error:', error)
      ctx.redirect('/auth/login?error=auth_failed')
    }
  })

  /**
   * @swagger
   * /auth/logout:
   *   get:
   *     summary: Logout endpoint
   *     description: Clears authentication cookies and redirects to Keycloak logout
   *     tags:
   *       - Auth
   *     responses:
   *       '302':
   *         description: Redirect to login page
   */
  router.get('(.*)/auth/logout', async (ctx) => {
    // Clear cookies
    auth.logout(ctx.response)

    // Redirect to Keycloak logout
    const redirectUri = `${ctx.protocol}://${ctx.host}/auth/login`
    const keycloakLogoutUrl = `${auth.keycloakUrl}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(redirectUri)}`

    ctx.redirect(keycloakLogoutUrl)
  })

  /**
   * @swagger
   * /auth/profile:
   *   get:
   *     summary: Get user profile
   *     description: Returns the authenticated user's profile information
   *     tags:
   *       - Auth
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: User profile information
   *       '401':
   *         description: Unauthorized
   */
  router.get(
    '(.*)/auth/profile',
    auth.middleware.extractJwtToken,
    async (ctx) => {
      ctx.body = {
        profile: ctx.state.user,
        message: 'This route is protected',
      }
    }
  )
}

// Export middleware for use in other routes
export const middleware = {
  extractJwtToken: auth.middleware.extractJwtToken,
}
