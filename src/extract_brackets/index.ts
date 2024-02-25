// pnpm plv8ify generate --input-file="./src/extract_brackets/index.ts" --output-folder="./src/extract_brackets"
import type { Output } from 'balanced-match'
import balanced from 'balanced-match'
import { isNil } from 'lodash-es'

type TestInputType = `[2021-10-04 17:56:55,374 UTC][INFO][AutoTriggerWorker][pool-1-thread-10][serial_number=A124750753 request_id=38859467 rules_version=2] Patch command created: PatchCommand{id=81603658, serialNumber=A124750753, type=VT_NN, startPage=163, endPage=175, status=UNSUBMITTED, analysisRequestId=38859467, priority=80, batchNumber=2, createdTimestamp=Mon Oct 04 17:56:55 UTC 2021, pcStartEcgPage=169, pcStartEcgOffset=90, pcEndEcgPage=170, pcEndEcgOffset=592, decisionThreshold=0.6} rpeak_request_list=true request_id=38859467` | `[2021-10-04 17:26:42.161 UTC] [INFO] [nioEventLoopGroup-3-4] ServerChallengeResponseHandler - [/174.245.252.233:45008] [A124750753] uptime=52, events=0, log_bytes=184, connection_reason=FIRST_CONNECTION, diagnostics=true, rpeak_pages=0` | `[2021-10-04 17:56:53.191 UTC] [INFO] [pool-13-thread-1] Logging - AUDIT[salesforce]: Updating device percentage leads on, percent_leads_on="100.00" attempted for device A124750753 | object="DEVICE" | status="SUCCESS" | error=""` | `[2021-10-04 19:56:57.192 UTC] [INFO] [defaultEventExecutorGroup-2-7] ServerMessages - [/174.245.252.225:30822] [A124750753] sent server message: RUN_PATCH_CLASSIFIER (classifier_count="3" id="81622155" classifier_id="81622155" priority="80" id="81622156" classifier_id="81622156" priority="80" id="81622157" classifier_id="81622157" priority="80"  serverRequestTime="2021-10-04T19:56:57.192Z" data_latency=true rpeak_request_list=true)`

function getBracketBodies(input: string, matches = [] as Output[]) {
  const firstMatch = balanced('[', ']', input) ?? balanced('{', '}', input) ?? balanced('(', ')', input)
  if (typeof firstMatch !== 'undefined')
    matches.push(firstMatch)
  if (typeof firstMatch === 'undefined')
    return matches
  else return getBracketBodies(firstMatch.post, matches)
}

export function extract_brackets(input: string): string[] {
  return getBracketBodies(input).map(match => match.body)
}
