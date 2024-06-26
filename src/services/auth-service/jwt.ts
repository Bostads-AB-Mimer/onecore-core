import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'

import hash from './hash'
import config from '../../common/config'
import { logger } from 'onecore-utilities'

const getUser = async (username: string) => {
  const user = {
    id: username,
    locked: false,
    disabled: false,
    failedLoginAttempts: 0,
    passwordHash: config.auth.testAccount.hash,
    salt: config.auth.testAccount.salt,
  }

  return user
}

const setUserFailedLoginAttempts = async (userId: string, attempts: number) => {
  return
}

const setUserLocked = async (userId: string, locked: boolean) => {
  return
}

export const createToken = async (username: string, password: string) => {
  try {
    const user = await getUser(username)

    if (!user) {
      throw createHttpError(401, new Error(`Unknown user or invalid password.`))
    }

    if (user.locked) {
      throw createHttpError(403, new Error(`User locked: ${username}.`))
    }

    if (user.disabled) {
      throw createHttpError(403, new Error(`User disabled: ${username}.`))
    }

    if (user.passwordHash !== (await hash.hashPassword(password, user.salt))) {
      const fails = user.failedLoginAttempts + 1

      await setUserFailedLoginAttempts(user.id, fails)

      if (fails >= config.auth.maxFailedLoginAttempts) {
        await setUserLocked(user.id, true)
      }

      throw createHttpError(401, new Error(`Unknown user or invalid password.`))
    }

    // Clear failed login attempts
    await setUserFailedLoginAttempts(user.id, 0)

    // Create token
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.id,
      },
      config.auth.secret,
      {
        expiresIn: config.auth.expiresIn,
      }
    )

    return { token }
  } catch (error) {
    logger.error(error)
    throw error
  }
}
