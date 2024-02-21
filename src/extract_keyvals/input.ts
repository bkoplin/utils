// plv8ify generate --write-bundler-output
// See ./types.ts for type conversions

// const word = maybe('"').before(oneOrMore(anyOf(wordChar, '_', '-', digit)).grouped().after(maybe('"')))
// const keyVal = createRegExp(word.as('key'), '=', word.as('value'))
import { attempt, isError } from 'lodash-es'

export function extract_keyvals(input: string) {
  const regex = /(?<key>(?:\w|_|-|\d)+)"?=(?<value>(?:(?:\w|_|-|\d)+)|(?:\[[^\]]+\])|(?:"[^"]+"))/g
  const equalsMatches = input.matchAll(regex)
  return Array.from(equalsMatches).reduce((acc, match) => {
    if (match.groups?.key && match.groups?.value)
      return { ...acc, [match.groups.key]: isError(attempt(JSON.parse, match.groups.value)) ? match.groups.value : JSON.parse(match.groups.value) }
    else return acc
  }, {})
}
