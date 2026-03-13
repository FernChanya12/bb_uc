import oracledb from 'oracledb';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initPool() {
  if (!pool) {
    const connectString = `${process.env.DB_HOST || '10.1.102.74'}:${process.env.DB_PORT || '1521'}/${process.env.DB_SERVICE || 'resdb'}`;
    pool = await oracledb.createPool({
      user: process.env.DB_USER || 'APP',
      password: process.env.DB_PASSWORD || '',
      connectString,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });
  }
  return pool;
}

// Convert MySQL ? placeholders to Oracle :n and expand array params
function convertQuery(sql, params = []) {
  let idx = 0;
  const newParams = [];
  const newSql = sql.replace(/\?/g, () => {
    const param = params[idx++];
    if (Array.isArray(param)) {
      const placeholders = param.map((v) => {
        newParams.push(v);
        return `:${newParams.length}`;
      });
      return placeholders.join(', ');
    }
    newParams.push(param);
    return `:${newParams.length}`;
  });
  return { sql: newSql, params: newParams };
}

function mapResult(result) {
  if (result.rows !== undefined) {
    return [result.rows, result];
  }
  return [{ affectedRows: result.rowsAffected }, result];
}

class OracleConnection {
  constructor(conn) {
    this._conn = conn;
  }

  async query(sql, params = []) {
    const { sql: oSql, params: oParams } = convertQuery(sql, params);
    const result = await this._conn.execute(oSql, oParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return mapResult(result);
  }

  async beginTransaction() {
    // Oracle auto-disables autoCommit per connection; no explicit BEGIN needed
  }

  async commit() {
    await this._conn.commit();
  }

  async rollback() {
    await this._conn.rollback();
  }

  async release() {
    await this._conn.close();
  }
}

const dbConfig = {
  async getConnection() {
    const p = await initPool();
    const conn = await p.getConnection();
    return new OracleConnection(conn);
  },

  async query(sql, params = []) {
    const p = await initPool();
    const conn = await p.getConnection();
    try {
      const { sql: oSql, params: oParams } = convertQuery(sql, params);
      const result = await conn.execute(oSql, oParams, { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true });
      return mapResult(result);
    } finally {
      await conn.close();
    }
  },
};

export default dbConfig;

