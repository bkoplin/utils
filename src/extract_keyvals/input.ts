// pnpm plv8ify generate --input-file="./src/extract_keyvals/input.ts" --output-folder="./src/extract_keyvals"
import { attempt, groupBy, isEmpty, isError, isNil, snakeCase, trim, uniq } from 'lodash-es'
import type { ParseRegExp } from 'type-level-regexp'
import { createRegExp, spreadRegExpIterator } from 'type-level-regexp'
import type { SnakeCase } from 'type-fest'
import balanced from 'balanced-match'

export function extract_keyvals(input: string) {
  const regex = createRegExp('\\b(?<key>\\w+)"?=(?<value>(?:\\w{3} \\w{3} \\d{2} \\d{2}:\\d{2}:\\d{2} \\w{3} \\d{4})|(?:"([^"]+)")|(?:\\[([^\\]]+)\\])|(?:\\w+))', ['g'])
  const serverRegex = createRegExp('\\/(?<server>(?:\\d+\\.\\d+\\.\\d+\\.\\d+:\\d+))' as const)
  const serverMatch = input.match(serverRegex)
  const serialNumber = input.match(/\[(A\d+)\]/)?.[1]
  const server = serverMatch !== null ? serverMatch.groups.server : null
  const inputMatches = input.matchAll(regex)
  const logTime = balanced('[', ']', input)!.body.replaceAll(',', '.')
  const matches = spreadRegExpIterator(inputMatches)
  const groups = matches.map((match) => {
    if (!isNil(match) && typeof match.groups !== 'undefined') {
      const { key, value: origValue } = match.groups
      const value = isError(attempt(JSON.parse, trim(origValue, ' "'))) ? trim(origValue, ' "') : JSON.parse(trim(origValue, ' "'))
      if (key && typeof value !== 'undefined')
        return { key: snakeCase(key) as SnakeCase<typeof key>, value }
    }
    return { key: null, value: null }
  })
  const obj = groupBy(groups, 'key')
  for (const k in obj) {
    obj[k] = uniq(obj[k].map(({ key, value }) => value))
    if (obj[k].length === 1)
      obj[k] = obj[k][0]
  }

  return { serial_number: serialNumber, ...obj, server, log_time: logTime }
}
