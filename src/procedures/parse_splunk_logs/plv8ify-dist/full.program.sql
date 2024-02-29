
DROP FUNCTION IF EXISTS parse_splunk_logs(source_table_name TEXT) CASCADE;


CREATE OR REPLACE FUNCTION parse_splunk_logs(source_table_name TEXT) RETURNS JSONB AS 
$plv8ify$
  const code = plv8.execute(`SELECT source FROM plv8_js_modules WHERE module = 'parse_splunk_logs'`)[0].source;
  eval(code);

  return parse_splunk_logs(source_table_name)
$plv8ify$ LANGUAGE plv8 IMMUTABLE STRICT;
