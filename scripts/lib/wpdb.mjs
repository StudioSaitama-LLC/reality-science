// Minimal streaming parser for an All-in-One WP Migration database.sql dump.
// The dump uses the literal table-prefix placeholder `SERVMASK_PREFIX_` and emits
// exactly one row per `INSERT INTO ... VALUES (...);` line (verified for this dump).
import fs from 'node:fs';
import readline from 'node:readline';

// Parse the `(...),(...)` body of a VALUES clause into an array of rows,
// each row an array of field values (string | null). Handles MySQL string
// escaping (\\ \' \" \n \r \t \0) and unquoted NULL/numbers.
export function parseValues(body) {
  const rows = [];
  let i = 0;
  const n = body.length;
  while (i < n) {
    while (i < n && body[i] !== '(') i++;
    if (i >= n) break;
    i++; // skip '('
    const row = [];
    while (i < n && body[i] !== ')') {
      while (i < n && (body[i] === ',' || body[i] === ' ')) i++;
      if (body[i] === ')') break;
      if (body[i] === "'") {
        i++;
        let buf = '';
        while (i < n) {
          const c = body[i];
          if (c === '\\') {
            const next = body[i + 1];
            const map = { n: '\n', r: '\r', t: '\t', '0': '\0', b: '\b', Z: '\x1a' };
            buf += map[next] !== undefined ? map[next] : next;
            i += 2;
            continue;
          }
          if (c === "'") { i++; break; }
          buf += c;
          i++;
        }
        row.push(buf);
      } else {
        let buf = '';
        while (i < n && body[i] !== ',' && body[i] !== ')') { buf += body[i]; i++; }
        buf = buf.trim();
        row.push(buf === 'NULL' ? null : buf);
      }
    }
    if (body[i] === ')') i++;
    rows.push(row);
  }
  return rows;
}

// Stream the dump, invoking onRow(tableShortName, rowArray) for each INSERT row
// of the tables named in `wanted` (short names, e.g. 'posts', 'postmeta').
export async function streamTables(sqlPath, wanted, onRow) {
  const want = new Set(wanted);
  const prefixes = {};
  for (const t of wanted) prefixes[`INSERT INTO \`SERVMASK_PREFIX_${t}\` VALUES `] = t;
  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    for (const [pfx, t] of Object.entries(prefixes)) {
      if (line.startsWith(pfx)) {
        let rest = line.slice(pfx.length).trim();
        if (rest.endsWith(';')) rest = rest.slice(0, -1);
        for (const row of parseValues(rest)) onRow(t, row);
        break;
      }
    }
  }
}

// Column orders for the tables we read.
export const COLS = {
  posts: ['ID', 'post_author', 'post_date', 'post_date_gmt', 'post_content', 'post_title',
    'post_excerpt', 'post_status', 'comment_status', 'ping_status', 'post_password',
    'post_name', 'to_ping', 'pinged', 'post_modified', 'post_modified_gmt',
    'post_content_filtered', 'post_parent', 'guid', 'menu_order', 'post_type',
    'post_mime_type', 'comment_count'],
  postmeta: ['meta_id', 'post_id', 'meta_key', 'meta_value'],
  terms: ['term_id', 'name', 'slug', 'term_group'],
  term_taxonomy: ['term_taxonomy_id', 'term_id', 'taxonomy', 'description', 'parent', 'count'],
  term_relationships: ['object_id', 'term_taxonomy_id', 'term_order'],
};

export function toObj(table, row) {
  const cols = COLS[table];
  const o = {};
  for (let j = 0; j < cols.length; j++) o[cols[j]] = row[j];
  return o;
}
