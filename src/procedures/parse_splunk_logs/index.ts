// pnpm plv8ify generate --input-file="./src/procedures/parse_splunk_logs/index.ts" --output-folder="./src/procedures/parse_splunk_logs"
/// <reference types="@types/plv8-internal" />

export function parse_splunk_logs(source_table_name: string) {
  const plan = plv8.prepare(`SELECT EXTRACT_KEYVALS(_raw) ->> 'serial_number' serial_number, (EXTRACT_KEYVALS(_raw) ->> 'log_time') ::TIMESTAMP first_connection_time FROM ${plv8.quote_ident(source_table_name)} WHERE _raw ~* $1`, ['text'])
  const firstConnectionPlan = plv8.prepare(`SELECT DISTINCT EXTRACT_KEYVALS(_raw) ->> 'serial_number' serial_number, (EXTRACT_KEYVALS(_raw) ->> 'log_time') ::TIMESTAMP first_connection_time FROM ${plv8.quote_ident(source_table_name)} WHERE _raw ~* 'FIRST_CONNECTION'`)
  const patchActivationPlan = plv8.prepare(`SELECT DISTINCT EXTRACT_KEYVALS(_raw) ->> 'serial_number' serial_number, (EXTRACT_KEYVALS(_raw) ->> 'patch_activation_time') ::TIMESTAMP patch_activation_time FROM ${plv8.quote_ident(source_table_name)} WHERE EXTRACT_KEYVALS(_raw) @@ '$.patch_activation_time != null' AND _raw ~ $1`, ['text'])
  const firstConnectionRecords = firstConnectionPlan.execute()
  firstConnectionRecords.forEach((firstConnectionRow) => {
    patchActivationPlan.execute([firstConnectionRow.serial_number]).forEach((patchActivationRow) => {
      plv8.elog(LoggingLevel.DEBUG1, `Parsing Records associated with serial_number: ${patchActivationRow.serial_number} and first_connection_time: ${firstConnectionRow.first_connection_time} and patch_activation_time: ${patchActivationRow.patch_activation_time}`)
    })
    patchActivationPlan.free()
  })
  firstConnectionPlan.free()
  // plan.free()

  return null
}

// WITH RECURSIVE pa_record AS (
//   SELECT
//       SUBSTRING(s._raw, '\[(A\d+)\]') serial_number
//       , (s.log_object ->> 'patch_activation_time') ::TIMESTAMP patch_activation_time
//   FROM splunk_sample_rs s
//   WHERE s.log_object @@ '$.patch_activation_time != null'
// ), first_connection AS (
//   SELECT
//       SUBSTRING(s._raw, '\[(A\d+)\]') serial_number
//       , (s.log_object ->> 'log_time') ::TIMESTAMP first_connection_time
//   FROM splunk_sample_rs s
//   WHERE s.log_object @@ '$.connection_reason == "FIRST_CONNECTION"'
// ), event_requests AS (
//   SELECT
//       s.sourcetype
//       , (JSONB_POPULATE_RECORD(NULL::event_analysis_request, s.log_object)).*
//       , s._raw
//       , s.log_object
//   FROM splunk_sample_rs s
//   WHERE
//       s._raw ~ 'Created analysis request'
// ), patch_commands AS (
//   SELECT
//       s.sourcetype
//       , (JSONB_POPULATE_RECORD(NULL::event_patch_command, s.log_object)).*
//       , s._raw
//       , s.log_object
//   FROM splunk_sample_rs s
//   WHERE
//       s.log_object @@ '$.analysis_request_id != null'
// ), classifier_responses AS (
//   SELECT
//       s.sourcetype
//       , (JSONB_POPULATE_RECORD(NULL::event_classifier_response, s.log_object)).*
//       , s._raw
//       , s.log_object
//   FROM splunk_sample_rs s
//   WHERE
//       s._raw ~ '(\yEventDataMessageHandler\y.+received event)'
// ), classifier_receipts AS (
//   SELECT
//       s.sourcetype
//       , (JSONB_POPULATE_RECORD(NULL::event_classifier_receipt, s.log_object)).*
//       , s._raw
//       , s.log_object
//   FROM splunk_sample_rs s
//   WHERE
//       s._raw ~ '(RoutingServiceProvider - event="transmission.received")'
// ), classifier_action AS (
//   SELECT
//       s.sourcetype
//       , (JSONB_POPULATE_RECORD(NULL::event_action, s.log_object)).*
//       , s._raw
//       , s.log_object
//   FROM splunk_sample_rs s
//   WHERE
//       s._raw ~ 'TransmissionFilter - event="transmission.filtered"'
//       OR
//       s._raw ~ 'EcgDlResultsProcessor - event="transmission.algorithm_processing_completed"'
// ), review_output AS (
//   SELECT
//       s.sourcetype
//       , (JSONB_POPULATE_RECORD(NULL::skyrunner_review_output, s.log_object)).*
//       , s._raw
//       , s.log_object
//   FROM splunk_sample_rs s
//   WHERE sourcetype = 'skyrunner_ws'
// )
// SELECT *
// FROM patch_commands
// -- FROM patch_commands cr
// -- JOIN pa_record USING(serial_number)
// -- JOIN first_connection USING(serial_number)
// -- ORDER BY log_object ->> 'log_time'
// LIMIT 100

/*
CASE
  WHEN s._raw ~ 'parsed first patch status log' THEN 'INCOMING: FIRST STATUS LOG'
  WHEN s._raw ~ 'Created analysis request' THEN 'INCOMING: ANALYSIS REQUEST'
  WHEN s._raw ~ '\yRpeakAnalysisRequest state set to\y' THEN 'SERVER: CREATE PATCH COMMANDS '||SUBSTRING(s._raw, 'RpeakAnalysisRequest state set to ([A-Z]+)')
  WHEN s._raw ~ '\yPatch command created\y' THEN 'SERVER: PATCH COMMAND CREATED, '||SUBSTRING(s._raw, 'status=([^,]+)')
  WHEN s._raw ~ '\yRUN_PATCH_CLASSIFIER\y' THEN 'OUTGOING: RUN PATCH CLASSIFIERS'
  WHEN s._raw ~ '\yACK_RUN_PATCH_CLASSIFIER\y' THEN 'INCOMING: ACKNOWLEDGE RUN PATCH CLASSIFIERS'
  WHEN s._raw ~ '\yEventDataMessageHandler\y.+received event' THEN 'INCOMING: RETURN CLASSIFIER RESULT'
  WHEN s._raw ~ 'RoutingServiceProvider - event="transmission.received"' THEN 'INCOMING: RECEIVE CLASSIFIER RESULT'
  WHEN s._raw ~ 'TransmissionFilter - event="transmission.filtered"' THEN 'SERVER: TRANMISSION FILTERED'
  WHEN s._raw ~ 'EcgDlResultsProcessor - event="transmission.algorithm_processing_completed"' THEN 'SERVER: ALGORITHM PROCESSING COMPLETE'
  WHEN s._raw ~ 'Logging - AUDIT' THEN 'INCOMING: LEADS ON AUDIT'
  WHEN s.sourcetype = 'skyrunner_ws' AND JSONB_PATH_EXISTS(EXTRACT_KEYVALS(s._raw), '$.event') THEN 'IDTF: '||UPPER(EXTRACT_KEYVALS(s._raw) ->> 'event')
END
*/
