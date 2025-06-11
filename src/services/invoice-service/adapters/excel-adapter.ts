import { Workbook, ValueType, Cell } from 'exceljs'
import { createReadStream } from 'fs'
import { columnNames, InvoiceDataRow } from '../types'

const getCellValue = (cell: Cell): string | number => {
  if (cell.type === ValueType.Date) {
    const dateval = cell.value as Date
    const cellValue = dateval.toISOString().split('T')[0]
    return cellValue
  } else if (cell.type === ValueType.Number) {
    return cell.value as number
  } else {
    return cell.value ? cell.value.toString() : ' '
  }
}

export const excelFileToInvoiceDataRows = async (
  invoiceRowsExcelFilePath: string
) => {
  const excelDataStream = await createReadStream(invoiceRowsExcelFilePath)
  const workbook = new Workbook()
  await workbook.xlsx.read(excelDataStream)
  const rowCount = workbook.worksheets[0].rowCount
  const rows = workbook.worksheets[0].getRows(2, rowCount)
  const invoiceRows: InvoiceDataRow[] = []

  if (rows) {
    for (const row of rows) {
      const currentRow: InvoiceDataRow = {}

      /*      const cellContractMatch = (getCellValue(row.getCell(1)) as string).match(
        RegExp(/[0-9-].*?\/[0-9]{2}/g)
      )

      if (cellContractMatch && cellContractMatch.length > 0) {*/
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const columnName = columnNames[colNumber - 1]
        const cellValue = getCellValue(cell)

        currentRow[columnName] = cellValue
      })

      // Skip invoice summation rows
      if (
        currentRow.rentArticle &&
        (currentRow.rentArticle as string).trimEnd()
      ) {
        invoiceRows.push(currentRow)
      }
      /*} else {
        console.log(
          'First cell of row is "',
          getCellValue(row.getCell(1)),
          '", row discarded'
        )
      }*/
    }
  }

  return invoiceRows
}
