import { Contact } from 'onecore-types'

export const sendNotificationToContact = async (
  recipientContact: Contact,
  message: string
) => {
  console.log(`--- Message to ${recipientContact.emailAddress} ---`)
  console.log(message)
  console.log('------')
}

export const sendNotificationToRole = async (
  recipientRole: string,
  message: string
) => {
  console.log(`--- Message to ${recipientRole} ---`)
  console.log(message)
  console.log('------')
}
