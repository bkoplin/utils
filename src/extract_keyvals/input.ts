// pnpm plv8ify generate --input-file="./src/extract_keyvals/input.ts" --output-folder="./src/extract_keyvals"
// See ./types.ts for type conversions

// const word = maybe('"').before(oneOrMore(anyOf(wordChar, '_', '-', digit)).grouped().after(maybe('"')))
// const keyVal = createRegExp(word.as('key'), '=', word.as('value'))
import { attempt, groupBy, isEmpty, isError, isNil, trim, uniq } from 'lodash-es'

export function extract_keyvals(input: string) {
  const regex = /(?<key>(?:\w|_|-|\d)+)"?=(?<value>(?:(?:[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{2}:\d{2}:\d{2} [A-Z]{3} \d{4})|(?:\w|_|-|\d)+)|(?:\[[^\]]+\])|(?:"[^"]+"))/g
  const server = /(\/\d+\.\d+\.\d+\.\d+\:\d+)/
  const equalsMatches = input.matchAll(regex)
  const serverMatches = server.exec(input)?.[1]
  const groups = Array.from(equalsMatches).reduce((acc, match) => {
    if (typeof match.groups !== 'undefined') {
      const { key, value: origValue } = match.groups
      const value = isError(attempt(JSON.parse, trim(origValue, ' "'))) ? trim(origValue, ' "') : JSON.parse(trim(origValue, ' "'))
      if (key && typeof value !== 'undefined')
        acc.push({ key, value })
    }
    return acc
  }, [] as { key: string, value: string }[])
  const obj = groupBy(groups, 'key')
  for (const k in obj) {
    obj[k] = uniq(obj[k].map(({ key, value }) => value))
    if (obj[k].length === 1)
      obj[k] = obj[k][0]
  }

  if (isNil(serverMatches)) {
    if (isEmpty(obj))
      return null
    else return obj
  }
  else { return { ...obj, server: serverMatches } }
}
