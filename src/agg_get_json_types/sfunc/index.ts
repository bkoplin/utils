// pnpm plv8ify -g agg_get_json_types_sfunc "./src/agg_get_json_types/sfunc"
import { isNull, isUndefined, objectEntries, objectMap } from '@antfu/utils'
import { isBoolean, isDate, isJSON, isNumeric } from 'validator'
import type { JsonObject } from 'type-fest'

export default function (state: Record<string, Array<'NULL' | 'BOOLEAN' | 'TIMESTAMPTZ' | 'NUMERIC' | 'JSONB' | 'TEXT'>>, input: JsonObject) {
  if (state === null)
    state = {}
  objectEntries(input).forEach(([key, value]) => {
    let newValue: string
    if (isNull(value) || isUndefined(value))
      return
    else if (typeof value !== 'string')
      newValue = JSON.stringify(value)
    else
      newValue = value
    if (isUndefined(state[key]))
      state[key] = []
    if (isNumeric(newValue) && !state[key].includes('NUMERIC'))
      state[key].push('NUMERIC')

    else if (isBoolean(newValue, { loose: false }) && !state[key].includes('BOOLEAN'))
      state[key].push('BOOLEAN')

    else if ('toISOString' in (new Date(newValue)) && value !== null && !state[key].includes('TIMESTAMPTZ') && typeof value !== 'number' && newValue.length > 1)
      state[key].push('TIMESTAMPTZ')

    else if (isJSON(newValue) && !state[key].includes('JSONB'))
      state[key].push('JSONB')
    else if (!state[key].includes('TEXT'))
      state[key].push('TEXT')
  })
  return state
}
