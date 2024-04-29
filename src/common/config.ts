import configPackage from '@iteam/config'
import dotenv from 'dotenv'
dotenv.config()

interface Account {
  userName: string
  salt: string
  hash: string
}

export interface Config {
  port: number
  tenantsLeasesService: {
    url: string
  }
  propertyInfoService: {
    url: string
  }
  documentsService: {
    url: string
  }
  communicationService: {
    url: string
  }
  ticketingService: {
    url: string
    database: string
    username: string
    password: string
  }
  auth: {
    secret: string
    expiresIn: string
    maxFailedLoginAttempts: number
    testAccount: Account
  }
  emailAddresses: {
    leasing: string
    tenantDefault: string
  }
  ticketingService: {
    url: string
    database: string
    username: string
    password: string
  }
}

const config = configPackage({
  file: `${__dirname}/../config.json`,
  defaults: {
    port: 5010,
    tenantsLeasesService: {
      url: 'http://localhost:5020',
    },
    propertyInfoService: {
      url: 'http://localhost:5030',
    },
    documentsService: {
      url: 'https://mim-shared-apim-apim01-t.azure-api.net/document',
    },
    communicationService: {
      url: 'http://localhost:5040',
    },
    ticketingService: {
      url: 'http://127.0.0.1:8069',
      database: 'odoo',
      username: 'admin',
      password: 'admin',
    },
    auth: {
      secret: 'very secret. replace this',
      expiresIn: '3h', // format allowed by https://github.com/zeit/ms
      maxFailedLoginAttempts: 3,
    },
    emailAddresses: {
      leasing: '',
      tenantDefault: '',
    },
    ticketingService: {
      url: 'http://127.0.0.1:8069',
    },
  },
})

export default {
  port: config.get('port'),
  tenantsLeasesService: config.get('tenantsLeasesService'),
  propertyInfoService: config.get('propertyInfoService'),
  documentsService: config.get('documentsService'),
  communicationService: config.get('communicationService'),
  ticketingService: config.get('ticketingService'),
  emailAddresses: config.get('emailAddresses'),
  auth: config.get('auth'),
  ticketingService: config.get('ticketingService'),
} as Config
