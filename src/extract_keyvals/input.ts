// pnpm plv8ify generate --input-file="./src/extract_keyvals/input.ts" --output-folder="./src/extract_keyvals"
import { attempt, groupBy, isEmpty, isError, isNil, snakeCase, trim, uniq } from 'lodash-es'
import type { ParseRegExp } from 'type-level-regexp'
import { createRegExp, spreadRegExpIterator } from 'type-level-regexp'
import type { SnakeCase } from 'type-fest'
import balanced from 'balanced-match'

type TestInputType = `[2021-10-04 17:56:55,374 UTC][INFO][AutoTriggerWorker][pool-1-thread-10][serial_number=A124750753 request_id=38859467 rules_version=2] Patch command created: PatchCommand{id=81603658, serialNumber=A124750753, type=VT_NN, startPage=163, endPage=175, status=UNSUBMITTED, analysisRequestId=38859467, priority=80, batchNumber=2, createdTimestamp=Mon Oct 04 17:56:55 UTC 2021, pcStartEcgPage=169, pcStartEcgOffset=90, pcEndEcgPage=170, pcEndEcgOffset=592, decisionThreshold=0.6} rpeak_request_list=true request_id=38859467` | `[2021-10-04 17:26:42.161 UTC] [INFO] [nioEventLoopGroup-3-4] ServerChallengeResponseHandler - [/174.245.252.233:45008] [A124750753] uptime=52, events=0, log_bytes=184, connection_reason=FIRST_CONNECTION, diagnostics=true, rpeak_pages=0` | `[2021-10-04 17:56:53.191 UTC] [INFO] [pool-13-thread-1] Logging - AUDIT[salesforce]: Updating device percentage leads on, percent_leads_on="100.00" attempted for device A124750753 | object="DEVICE" | status="SUCCESS" | error=""`

export function extract_keyvals(input: TestInputType) {
  const regex = createRegExp('\\b(?<key>\\w+)"?=(?<value>(?:\\w{3} \\w{3} \\d{2} \\d{2}:\\d{2}:\\d{2} \\w{3} \\d{4})|(?:"([^"]+)")|(?:\\[([^\\]]+)\\])|(?:\\w+))', ['g'])
  const serverRegex = createRegExp('\\/(?<server>(?:\\d+\\.\\d+\\.\\d+\\.\\d+:\\d+))' as const)
  const serverMatch = input.match(serverRegex)
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

  return { ...obj, server, log_time: logTime }
}
