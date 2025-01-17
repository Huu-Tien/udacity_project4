import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

const jwksUrl =
  'https://dev-foevfebriitltfwm.us.auth0.com/.well-known/jwks.json'

export async function handler(event) {
  try {
    logger.info('Authorizing a user', { data: event.authorizationToken })
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)
  const jwt = jsonwebtoken.decode(token, { complete: true })

  const _res = await Axios.get(jwksUrl)
  const keys = _res.data.keys
  const signKeys = keys.find((key) => key.kid === jwt.header.kid)

  if (!signKeys) throw new Error('Incorrect Keys')
  const pemDT = signKeys.x5c[0]
  const secret = `-----BEGIN CERTIFICATE-----\n${pemDT}\n-----END CERTIFICATE-----\n`

  const verifyToken = jsonwebtoken.verify(token, secret, {
    algorithms: ['RS256']
  })

  logger.info('Verify token', verifyToken)

  return verifyToken
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
