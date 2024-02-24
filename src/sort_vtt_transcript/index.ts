import fs from 'node:fs'
import { split } from 'lodash-es'

const transcriptraw = fs.readFileSync('/Users/benkoplin/Downloads/Splunk Sample Follow-Up (PRIVILEGED & CONFIDENTIAL)_2024-02-21.vtt', 'utf8')
const entries = split(transcriptraw, '\n\r').sort()
fs.writeFileSync('/Users/benkoplin/Downloads/Splunk Sample Follow-Up sorted_2024-02-21.vtt', entries.join('\n\r'))

if (import.meta.vitest) {
  const { test, it, expect } = import.meta.vitest
  test('read and split file', () => {
    expect(entries).toMatchFileSnapshot('./split_transcript.json')
  })
}
