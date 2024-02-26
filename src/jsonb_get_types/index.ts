// pnpm plv8ify generate --input-file="./src/jsonb_get_types/index.ts" --output-folder="./src/jsonb_get_types"
import { objectEntries } from '../object'

export function jsonb_get_types(input: object) {
  return objectEntries(input).reduce((acc, [key, value]) => acc += `${key} ${typeof value},\n`, '')
}
