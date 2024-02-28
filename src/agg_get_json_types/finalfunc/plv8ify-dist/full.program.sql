
DROP FUNCTION IF EXISTS agg_get_json_types_finalfunc(input JSONB) CASCADE;


CREATE OR REPLACE FUNCTION agg_get_json_types_finalfunc(input JSONB) RETURNS JSONB AS 
$plv8ify$
  const code = plv8.execute(`SELECT source FROM plv8_js_modules WHERE module = 'agg_get_json_types_finalfunc'`)[0].source;
  eval(code);

  return agg_get_json_types_finalfunc(input)
$plv8ify$ LANGUAGE plv8 IMMUTABLE STRICT;
