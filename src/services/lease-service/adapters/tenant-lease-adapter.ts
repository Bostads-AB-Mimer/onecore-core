import axios from 'axios'
import { Lease, LeaseStatus, Person } from '../types'

const getPerson = async (personId: string): Promise<Person> => {
  const person = await axios('https://random-data-api.com/api/v2/users')

  return {
    personId: personId,
    firstName: person.data.first_name,
    lastName: person.data.last_name,
    nationalRegistrationNumber: '12121212-1212',
    birthDate: '1212-12-12',
    addressId: '1337',
    address: undefined,
    mobilePhone: person.data.phone_number,
    phoneNumber: person.data.phone_number,
    emailAddress: person.data.email,
  }
}

const getLease = async (leaseId: string): Promise<Lease> => {
  const person1 = await getPerson(Math.round(Math.random() * 10000).toString())
  const person2 = await getPerson(Math.round(Math.random() * 10000).toString())

  const person = await axios('https://random-data-api.com/api/v2/users')

  const address = {
    addressId: Math.round(Math.random() * 100000).toString(),
    street: person.data.address.street_name,
    number: Math.round(Math.random() * 1000).toString(),
    postalCode: person.data.address.zip_code,
    city: person.data.address.city,
  }

  person1.addressId = address.addressId
  person1.address = address
  person2.addressId = address.addressId
  person2.address = address

  const lease = {
    leaseId: leaseId,
    leaseNumber: Math.round(Math.random() * 10000).toString(),
    leaseStartDate: new Date(),
    leaseEndDate: new Date(),
    status: LeaseStatus.Active,
    tenantPersonIds: [person1.personId, person2.personId],
    tenants: [person1, person2],
    apartmentId: Math.round(Math.random() * 1000).toString(),
    apartment: undefined,
  }

  return lease
}

export { getLease }
