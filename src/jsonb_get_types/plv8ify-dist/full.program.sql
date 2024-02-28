
DROP FUNCTION IF EXISTS jsonb_get_types(input JSONB);


CREATE OR REPLACE FUNCTION jsonb_get_types(input JSONB) RETURNS JSONB AS 
$plv8ify$

  const code = plv8.execute(`SELECT source FROM plv8_js_modules WHERE module = 'jsonb_get_types'`)[0].source;

  eval(code);

  return jsonb_get_types(input)

$plv8ify$ LANGUAGE plv8 IMMUTABLE STRICT;

