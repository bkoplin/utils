// pnpm plv8ify generate -g="jsonb_get_types" --input-file="./src/jsonb_get_types/index.ts" --output-folder="./src/jsonb_get_types"
import { objectEntries, objectMap } from '@antfu/utils'
import { isBoolean, isDate, isJSON, isNumeric } from 'validator'

export default function jsonb_get_types(input: object) {
  const mapped = objectMap(input, (key, value) => {
    if (value === null)
      return [key, 'NULL']
    let newValue: string
    if (typeof value !== 'string')
      newValue = JSON.stringify(value)
    else
      newValue = value

    if (isBoolean(newValue, { loose: false }))
      return [key, 'BOOLEAN']
    if (isDate(newValue))
      return [key, 'TIMESTAMPTZ']
    if (isNumeric(newValue))
      return [key, 'NUMERIC']
    if (isJSON(newValue))
      return [key, 'JSONB']
    else return [key, 'TEXT']
  })
  return objectEntries(mapped).map(([key, val]) => `${key} ${val}`).join(',\n')
}
