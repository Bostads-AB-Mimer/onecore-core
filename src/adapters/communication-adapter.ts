import axios from 'axios'
import config from '../common/config'
import { Contact } from 'onecore-types'

export const sendNotificationToContact = async (
  recipientContact: Contact,
  subject: string,
  message: string
) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      to: recipientContact.emailAddress,
      subject,
      text: message,
    },
    headers: {
      'Content-type': 'application/json',
    },
  }

  console.log(
    'Sending',
    `${config.communicationService.url}/sendMessage`,
    axiosOptions
  )

  const result = await axios(
    `${config.communicationService.url}/sendMessage`,
    axiosOptions
  )

  return result.data
}

export const sendNotificationToRole = async (
  recipientRole: string,
  subject: string,
  message: string
) => {
  const axiosOptions = {
    method: 'POST',
    data: {
      to: `anders+${recipientRole}@bornholm.se`,
      subject,
      text: message,
    },
    headers: {
      'Content-type': 'application/json',
    },
  }

  const result = await axios(
    `${config.communicationService.url}/sendMessage`,
    axiosOptions
  )

  return result.data
}
