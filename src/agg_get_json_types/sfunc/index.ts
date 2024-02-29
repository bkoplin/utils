// pnpm plv8ify -g agg_get_json_types_sfunc "./src/agg_get_json_types/sfunc"
import { isNull, isUndefined, objectEntries, objectMap } from '@antfu/utils'
import { isBoolean, isDate, isJSON, isNumeric } from 'validator'
import type { JsonObject } from 'type-fest'
import { isArray, isObject } from 'lodash-es'

export default function (state: Record<string, Array<'NULL' | 'BOOLEAN' | 'TIMESTAMP' | 'NUMERIC' | 'JSONB' | 'TEXT'>>, input: JsonObject) {
  if (state === null)
    state = {}
  objectEntries(input).forEach(([key, value]) => {
    let newValue: string
    if (isNull(value) || isUndefined(value))
      return
    else if (typeof value !== 'string')
      newValue = `${value}`
    else
      newValue = value
    if (isUndefined(state[key]))
      state[key] = []
    if ((typeof value === 'number' || isNumeric(newValue)) && !state[key].includes('NUMERIC'))
      state[key].push('NUMERIC')

    else if ((isBoolean(newValue, { loose: false }) || typeof value === 'boolean') && !state[key].includes('BOOLEAN') && typeof value !== 'number')
      state[key].push('BOOLEAN')
    else if ((isObject(value) || isArray(value)) && !state[key].includes('JSONB'))
      state[key].push('JSONB')
    else if ((new Date(value)).toString() !== 'Invalid Date' && value !== null && !state[key].includes('TIMESTAMP') && typeof value !== 'number' && newValue.length > 1 && typeof value !== 'boolean')
      state[key].push('TIMESTAMP')
    else if (!state[key].includes('TEXT') && typeof value === 'string')
      state[key].push('TEXT')
  })
  return state
}
