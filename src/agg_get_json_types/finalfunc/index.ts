// pnpm plv8ify -g agg_get_json_types_finalfunc "./src/agg_get_json_types/finalfunc"
import { objectEntries } from '@antfu/utils'
import type { JsonObject } from 'type-fest'

export default function (input: Record<string, Array<'NULL' | 'BOOLEAN' | 'TIMESTAMPTZ' | 'NUMERIC' | 'JSONB' | 'TEXT'>>) {
  return objectEntries(input).map(([key, value]) => `"${key}" ${value.join('|')}`).join(',\n')
}
