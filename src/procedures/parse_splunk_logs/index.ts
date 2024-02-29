// pnpm plv8ify generate --input-file="./src/procedures/parse_splunk_logs/index.ts" --output-folder="./src/procedures/parse_splunk_logs"
/// <reference types="@types/plv8-internal" />

export default function parse_splunk_logs(source_table_name: string) {
  plv8.elog(INFO, `Starting procedure to process splunk logs from ${source_table_name}, ${new Date().toISOString()}`)
  const tempTableName = `${source_table_name}_temp`
  plv8.execute(`CREATE TABLE ${tempTableName} AS (
      SELECT EXTRACT_KEYVALS(_raw) log_object, * FROM ${plv8.quote_ident(source_table_name)}
    );`)
  plv8.execute(`CREATE INDEX ON ${tempTableName} (log_object); CREATE INDEX ON ${tempTableName} (_raw);`)
  // plv8.execute(`VACUUM (ANALYZE) ${tempTableName};`)
  plv8.elog(INFO, `Created table ${tempTableName} for parsing, ${new Date().toISOString()}`)
  const serialNumbers = plv8.execute(`SELECT DISTINCT log_object ->> 'serial_number' serial_number FROM ${tempTableName} WHERE log_object ->> 'serial_number' IS NOT NULL ORDER BY 1`).map(({ serial_number }) => serial_number).filter(v => typeof v === 'string' && v.length > 0)
  plv8.elog(INFO, `Extracting log values from ${tempTableName} for serial numbers ${JSON.stringify(serialNumbers)}`)

  const firstConnectionPlan = plv8.prepare(`SELECT (log_object ->> 'log_time') ::TIMESTAMP first_connection_time FROM ${plv8.quote_ident(tempTableName)} WHERE log_object @@ '$.connection_reason == "FIRST_CONNECTION"' AND (log_object ->> 'serial_number') = $1`, ['text'])
  const patchActivationPlan = plv8.prepare(`SELECT (log_object ->> 'patch_activation_time') ::TIMESTAMP patch_activation_time FROM ${plv8.quote_ident(tempTableName)} WHERE log_object @@ '$.patch_activation_time != null' AND (log_object ->> 'serial_number') = $1`, ['text'])
  serialNumbers.forEach((serialNumber) => {
    if (typeof serialNumber === 'string' || serialNumber.length > 0) {
      firstConnectionPlan.execute([serialNumber]).forEach((firstConnectionRow) => {
        patchActivationPlan.execute([serialNumber]).forEach((patchActivationRow) => {
          const first_connection_time: Date = firstConnectionRow.first_connection_time
          const patch_activation_time: Date = patchActivationRow.patch_activation_time
          plv8.elog(INFO, `Parsing Records associated with serial_number: ${serialNumber} and first_connection_time: ${first_connection_time} and patch_activation_time: ${patch_activation_time}`)
          const firstConnectionTimeString = plv8.quote_nullable(first_connection_time.toISOString())
          const patchActivationTimeString = plv8.quote_nullable(patch_activation_time.toISOString())
          const sourceTableString = plv8.quote_nullable(source_table_name)
          gatewayConnections(firstConnectionTimeString, patchActivationTimeString, sourceTableString, tempTableName, serialNumber)
          eventAnalysisRequests(firstConnectionTimeString, patchActivationTimeString, sourceTableString, tempTableName, serialNumber)
          patchCommands(firstConnectionTimeString, patchActivationTimeString, sourceTableString, tempTableName, serialNumber)
          classifierResponses(firstConnectionTimeString, patchActivationTimeString, sourceTableString, tempTableName, serialNumber)
          classifierReceipts(firstConnectionTimeString, patchActivationTimeString, sourceTableString, tempTableName, serialNumber)
          eventActions(firstConnectionTimeString, patchActivationTimeString, sourceTableString, tempTableName, serialNumber)
          reviewOutputs(firstConnectionTimeString, patchActivationTimeString, sourceTableString, tempTableName, serialNumber)
        })
        patchActivationPlan.free()
      })
      firstConnectionPlan.free()
    }
  })
  plv8.execute(`DROP TABLE IF EXISTS ${tempTableName};`)
  plv8.elog(INFO, `Dropped temp table ${tempTableName}, ${new Date().toISOString()}`)
  // plan.free()

  return null
}

function gatewayConnections(firstConnectionTimeString: string | null, patchActivationTimeString: string | null, sourceTableString: string | null, tempTableName: string, serialNumber: any) {
  const eventAnalysisRequestsQuery = `
SELECT
  s.sourcetype
  , (JSONB_POPULATE_RECORD(NULL::gateway_connection, s.log_object)).*
  , s._raw
  , s.log_object
  , ${firstConnectionTimeString} ::TIMESTAMP first_connection_time
  , ${patchActivationTimeString} ::TIMESTAMP patch_activation_time
  , ${sourceTableString} source_table
FROM ${tempTableName} s
WHERE
  s.log_object ->> 'connection_reason' IS NOT NULL
  AND 
  (s.log_object ->> 'serial_number') = ${plv8.quote_literal(serialNumber)}
        `
  try {
    plv8.subtransaction(() => {
      plv8.elog(INFO, `Creating table splunk_01_gateway_connections, ${new Date().toISOString()}`)
      plv8.execute(`CREATE TABLE splunk_01_gateway_connections AS (${eventAnalysisRequestsQuery});`)
    })
  }
  catch (error) {
    plv8.elog(INFO, `CREATE TABLE splunk_01_gateway_connections failed, error message: ${error}, ${new Date().toISOString()}`)
    plv8.elog(INFO, `Inserting records into splunk_01_gateway_connections, ${new Date().toISOString()}`)
    try {
      plv8.subtransaction(() => plv8.execute(`INSERT INTO splunk_01_gateway_connections ${eventAnalysisRequestsQuery} AND NOT EXISTS(SELECT 1 FROM splunk_01_gateway_connections sub WHERE sub._raw = s._raw);`))
    }
    catch (e2) {
      plv8.elog(INFO, `INSERT INTO TABLE splunk_01_gateway_connections failed, error message: ${e2}, ${new Date().toISOString()}`)
    }
  }
}

function eventAnalysisRequests(firstConnectionTimeString: string | null, patchActivationTimeString: string | null, sourceTableString: string | null, tempTableName: string, serialNumber: any) {
  const eventAnalysisRequestsQuery = `
SELECT
  s.sourcetype
  , (JSONB_POPULATE_RECORD(NULL::event_analysis_request, s.log_object)).*
  , s._raw
  , s.log_object
  , ${firstConnectionTimeString} ::TIMESTAMP first_connection_time
  , ${patchActivationTimeString} ::TIMESTAMP patch_activation_time
  , ${sourceTableString} source_table
FROM ${tempTableName} s
WHERE
  s._raw ~ 'Created analysis request'
  AND 
  (s.log_object ->> 'serial_number') = ${plv8.quote_literal(serialNumber)}
        `
  try {
    plv8.subtransaction(() => {
      plv8.elog(INFO, `Creating table splunk_02_event_analysis_requests, ${new Date().toISOString()}`)
      plv8.execute(`CREATE TABLE splunk_02_event_analysis_requests AS (${eventAnalysisRequestsQuery});`)
    })
  }
  catch (error) {
    plv8.elog(INFO, `CREATE TABLE splunk_02_event_analysis_requests failed, error message: ${error}, ${new Date().toISOString()}`)
    plv8.elog(INFO, `Inserting records into splunk_02_event_analysis_requests, ${new Date().toISOString()}`)
    try {
      plv8.subtransaction(() => plv8.execute(`INSERT INTO splunk_02_event_analysis_requests ${eventAnalysisRequestsQuery} AND NOT EXISTS(SELECT 1 FROM splunk_02_event_analysis_requests sub WHERE sub._raw = s._raw);`))
    }
    catch (e2) {
      plv8.elog(INFO, `INSERT INTO TABLE splunk_02_event_analysis_requests failed, error message: ${e2}, ${new Date().toISOString()}`)
    }
  }
}

function patchCommands(firstConnectionTimeString: string | null, patchActivationTimeString: string | null, sourceTableString: string | null, tempTableName: string, serialNumber: any) {
  const eventAnalysisRequestsQuery = `
SELECT
  s.sourcetype
  , (JSONB_POPULATE_RECORD(NULL::event_patch_command, s.log_object)).*
  , s._raw
  , s.log_object
  , ${firstConnectionTimeString} ::TIMESTAMP first_connection_time
  , ${patchActivationTimeString} ::TIMESTAMP patch_activation_time
  , ${sourceTableString} source_table
FROM ${tempTableName} s
WHERE
  s.log_object @@ '$.analysis_request_id != null'
  AND 
  (s.log_object ->> 'serial_number') = ${plv8.quote_literal(serialNumber)}
        `
  try {
    plv8.subtransaction(() => {
      plv8.elog(INFO, `Creating table splunk_03_patch_commands, ${new Date().toISOString()}`)
      plv8.execute(`CREATE TABLE splunk_03_patch_commands AS (${eventAnalysisRequestsQuery});`)
    })
  }
  catch (error) {
    plv8.elog(INFO, `CREATE TABLE splunk_03_patch_commands failed, error message: ${error}, ${new Date().toISOString()}`)
    plv8.elog(INFO, `Inserting records into splunk_03_patch_commands, ${new Date().toISOString()}`)
    try {
      plv8.subtransaction(() => plv8.execute(`INSERT INTO splunk_03_patch_commands ${eventAnalysisRequestsQuery} AND NOT EXISTS(SELECT 1 FROM splunk_03_patch_commands sub WHERE sub._raw = s._raw);`))
    }
    catch (e2) {
      plv8.elog(INFO, `INSERT INTO TABLE splunk_03_patch_commands failed, error message: ${e2}, ${new Date().toISOString()}`)
    }
  }
}

function classifierResponses(firstConnectionTimeString: string | null, patchActivationTimeString: string | null, sourceTableString: string | null, tempTableName: string, serialNumber: any) {
  const eventAnalysisRequestsQuery = `
SELECT
  s.sourcetype
  , (JSONB_POPULATE_RECORD(NULL::event_classifier_response, s.log_object)).*
  , s._raw
  , s.log_object
  , ${firstConnectionTimeString} ::TIMESTAMP first_connection_time
  , ${patchActivationTimeString} ::TIMESTAMP patch_activation_time
  , ${sourceTableString} source_table
FROM ${tempTableName} s
WHERE
  s._raw ~ '(EventDataMessageHandler.+received event)'
  AND 
  (s.log_object ->> 'serial_number') = ${plv8.quote_literal(serialNumber)}
        `
  try {
    plv8.subtransaction(() => {
      plv8.elog(INFO, `Creating table splunk_04_classifier_responses, ${new Date().toISOString()}`)
      plv8.execute(`CREATE TABLE splunk_04_classifier_responses AS (${eventAnalysisRequestsQuery});`)
    })
  }
  catch (error) {
    plv8.elog(INFO, `CREATE TABLE splunk_04_classifier_responses failed, error message: ${error}, ${new Date().toISOString()}`)
    plv8.elog(INFO, `Inserting records into splunk_04_classifier_responses, ${new Date().toISOString()}`)
    try {
      plv8.subtransaction(() => plv8.execute(`INSERT INTO splunk_04_classifier_responses ${eventAnalysisRequestsQuery} AND NOT EXISTS(SELECT 1 FROM splunk_04_classifier_responses sub WHERE sub._raw = s._raw);`))
    }
    catch (e2) {
      plv8.elog(INFO, `INSERT INTO TABLE splunk_04_classifier_responses failed, error message: ${e2}, ${new Date().toISOString()}`)
    }
  }
}

function classifierReceipts(firstConnectionTimeString: string | null, patchActivationTimeString: string | null, sourceTableString: string | null, tempTableName: string, serialNumber: any) {
  const eventAnalysisRequestsQuery = `
SELECT
  s.sourcetype
  , (JSONB_POPULATE_RECORD(NULL::event_classifier_receipt, s.log_object)).*
  , s._raw
  , s.log_object
  , ${firstConnectionTimeString} ::TIMESTAMP first_connection_time
  , ${patchActivationTimeString} ::TIMESTAMP patch_activation_time
  , ${sourceTableString} source_table
FROM ${tempTableName} s
WHERE
  s._raw ~ '(RoutingServiceProvider - event="transmission.received")'
  AND 
  (s.log_object ->> 'serial_number') = ${plv8.quote_literal(serialNumber)}
        `
  try {
    plv8.subtransaction(() => {
      plv8.elog(INFO, `Creating table splunk_05_classifier_receipts, ${new Date().toISOString()}`)
      plv8.execute(`CREATE TABLE splunk_05_classifier_receipts AS (${eventAnalysisRequestsQuery});`)
    })
  }
  catch (error) {
    plv8.elog(INFO, `CREATE TABLE splunk_05_classifier_receipts failed, error message: ${error}, ${new Date().toISOString()}`)
    plv8.elog(INFO, `Inserting records into splunk_05_classifier_receipts, ${new Date().toISOString()}`)
    try {
      plv8.subtransaction(() => plv8.execute(`INSERT INTO splunk_05_classifier_receipts ${eventAnalysisRequestsQuery} AND NOT EXISTS(SELECT 1 FROM splunk_05_classifier_receipts sub WHERE sub._raw = s._raw);`))
    }
    catch (e2) {
      plv8.elog(INFO, `INSERT INTO TABLE splunk_05_classifier_receipts failed, error message: ${e2}, ${new Date().toISOString()}`)
    }
  }
}

function eventActions(firstConnectionTimeString: string | null, patchActivationTimeString: string | null, sourceTableString: string | null, tempTableName: string, serialNumber: any) {
  const eventAnalysisRequestsQuery = `
SELECT
  s.sourcetype
  , (JSONB_POPULATE_RECORD(NULL::event_action, s.log_object)).*
  , s._raw
  , s.log_object
  , ${firstConnectionTimeString} ::TIMESTAMP first_connection_time
  , ${patchActivationTimeString} ::TIMESTAMP patch_activation_time
  , ${sourceTableString} source_table
FROM ${tempTableName} s
WHERE
  (
    s._raw ~ 'TransmissionFilter - event="transmission.filtered"'
    OR
    s._raw ~ 'EcgDlResultsProcessor - event="transmission.algorithm_processing_completed"'
  )
  AND 
  (s.log_object ->> 'serial_number') = ${plv8.quote_literal(serialNumber)}
        `
  try {
    plv8.subtransaction(() => {
      plv8.elog(INFO, `Creating table splunk_06_event_actions, ${new Date().toISOString()}`)
      plv8.execute(`CREATE TABLE splunk_06_event_actions AS (${eventAnalysisRequestsQuery});`)
    })
  }
  catch (error) {
    plv8.elog(INFO, `CREATE TABLE splunk_06_event_actions failed, error message: ${error}, ${new Date().toISOString()}`)
    plv8.elog(INFO, `Inserting records into splunk_06_event_actions, ${new Date().toISOString()}`)
    try {
      plv8.subtransaction(() => plv8.execute(`INSERT INTO splunk_06_event_actions ${eventAnalysisRequestsQuery} AND NOT EXISTS(SELECT 1 FROM splunk_06_event_actions sub WHERE sub._raw = s._raw);`))
    }
    catch (e2) {
      plv8.elog(INFO, `INSERT INTO TABLE splunk_06_event_actions failed, error message: ${e2}, ${new Date().toISOString()}`)
    }
  }
}

function reviewOutputs(firstConnectionTimeString: string | null, patchActivationTimeString: string | null, sourceTableString: string | null, tempTableName: string, serialNumber: any) {
  const eventAnalysisRequestsQuery = `
SELECT
  s.sourcetype
  , (JSONB_POPULATE_RECORD(NULL::skyrunner_review_output, s.log_object)).*
  , s._raw
  , s.log_object
  , ${firstConnectionTimeString} ::TIMESTAMP first_connection_time
  , ${patchActivationTimeString} ::TIMESTAMP patch_activation_time
  , ${sourceTableString} source_table
FROM ${tempTableName} s
WHERE
  s.sourcetype = 'skyrunner_ws'
  AND 
  (s.log_object ->> 'serial_number') = ${plv8.quote_literal(serialNumber)}
        `
  try {
    plv8.subtransaction(() => {
      plv8.elog(INFO, `Creating table splunk_07_review_outputs, ${new Date().toISOString()}`)
      plv8.execute(`CREATE TABLE splunk_07_review_outputs AS (${eventAnalysisRequestsQuery});`)
    })
  }
  catch (error) {
    plv8.elog(INFO, `CREATE TABLE splunk_07_review_outputs failed, error message: ${error}, ${new Date().toISOString()}`)
    plv8.elog(INFO, `Inserting records into splunk_07_review_outputs, ${new Date().toISOString()}`)
    try {
      plv8.subtransaction(() => plv8.execute(`INSERT INTO splunk_07_review_outputs ${eventAnalysisRequestsQuery} AND NOT EXISTS(SELECT 1 FROM splunk_07_review_outputs sub WHERE sub._raw = s._raw);`))
    }
    catch (e2) {
      plv8.elog(INFO, `INSERT INTO TABLE splunk_07_review_outputs failed, error message: ${e2}, ${new Date().toISOString()}`)
    }
  }
}

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
