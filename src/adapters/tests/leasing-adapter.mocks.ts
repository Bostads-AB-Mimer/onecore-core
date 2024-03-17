import {
  Invoice,
  InvoiceTransactionType,
  PaymentStatus,
  WaitingList,
} from 'onecore-types'

const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
const sizMonthsMs = 182 * 24 * 60 * 60 * 1000

export const mockedInvoices: Invoice[] = [
  {
    amount: 123,
    debitStatus: 1,
    paymentStatus: PaymentStatus.Paid,
    fromDate: new Date(),
    toDate: new Date(Date.now() + thirtyDaysMs),
    expirationDate: new Date(Date.now() + thirtyDaysMs),
    invoiceDate: new Date(Date.now() + thirtyDaysMs),
    invoiceId: '123456',
    leaseId: '123-456-789/01',
    transactionType: InvoiceTransactionType.Rent,
    transactionTypeName: 'HYRA',
  },
  {
    amount: 456,
    debitStatus: 1,
    paymentStatus: PaymentStatus.Paid,
    fromDate: new Date(Date.now() - thirtyDaysMs),
    toDate: new Date(Date.now()),
    expirationDate: new Date(Date.now() - thirtyDaysMs),
    invoiceDate: new Date(Date.now() - thirtyDaysMs),
    invoiceId: '3456789',
    leaseId: '123-456-789/01',
    transactionType: InvoiceTransactionType.Rent,
    transactionTypeName: 'HYRA',
  },
]

export const mockedProblematicInvoices: Invoice[] = [
  {
    ...mockedInvoices[0],
    transactionType: InvoiceTransactionType.Reminder,
  },
  {
    ...mockedInvoices[1],
    transactionType: InvoiceTransactionType.DebtCollection,
  },
]

export const mockedOldProblematicInvoices: Invoice[] = [
  {
    ...mockedInvoices[0],
    transactionType: InvoiceTransactionType.Reminder,
    expirationDate: new Date(Date.now() - sizMonthsMs - thirtyDaysMs),
  },
  {
    ...mockedInvoices[1],
    transactionType: InvoiceTransactionType.DebtCollection,
    expirationDate: new Date(Date.now() - sizMonthsMs - thirtyDaysMs),
  },
]

export const mockedWaitingList: WaitingList[] = [
  {
    ApplicantCaption: 'Foo Bar',
    ContactCode: 'P12345',
    ContractFromApartment: new Date('2024-02-29T23:00:00.000Z'),
    QueuePoints: 45,
    QueuePointsSocialConnection: 0,
    WaitingListFrom: new Date('2024-01-31T23:00:00.000Z'),
    WaitingListTypeCaption: 'Bostad',
  },
  {
    ApplicantCaption: 'Foo Bar',
    ContactCode: 'P12345',
    ContractFromApartment: new Date('2024-02-29T23:00:00.000Z'),
    QueuePoints: 45,
    QueuePointsSocialConnection: 0,
    WaitingListFrom: new Date('2024-01-31T23:00:00.000Z'),
    WaitingListTypeCaption: 'Bilplats (intern)',
  },
  {
    ApplicantCaption: 'Foo Bar',
    ContactCode: 'P12345',
    ContractFromApartment: new Date('2024-02-29T23:00:00.000Z'),
    QueuePoints: 45,
    QueuePointsSocialConnection: 0,
    WaitingListFrom: new Date('2024-01-31T23:00:00.000Z'),
    WaitingListTypeCaption: 'Bilplats (extern)',
  },
]
