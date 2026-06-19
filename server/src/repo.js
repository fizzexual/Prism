const PROJECT_COLS = 'id, name, document, thumbnail, created_at, updated_at';
const ASSET_COLS = 'id, project_id, filename, original, mime, size, created_at';

/**
 * PostgreSQL-backed data access. Implements the repo interface consumed by the
 * route factories. node-postgres serializes JS objects to JSON for jsonb
 * params and parses jsonb back into JS objects on read.
 */
export function createPgRepo(pool) {
  return {
    async listProjects() {
      const { rows } = await pool.query(
        `SELECT id, name, thumbnail, created_at, updated_at
           FROM projects ORDER BY updated_at DESC`,
      );
      return rows;
    },

    async createProject({ name, document = { pages: [] }, thumbnail = null }) {
      const { rows } = await pool.query(
        `INSERT INTO projects(name, document, thumbnail)
         VALUES ($1, $2, $3) RETURNING ${PROJECT_COLS}`,
        [name, document, thumbnail],
      );
      return rows[0];
    },

    async getProject(id) {
      const { rows } = await pool.query(
        `SELECT ${PROJECT_COLS} FROM projects WHERE id = $1`,
        [id],
      );
      return rows[0] || null;
    },

    async updateProject(id, patch) {
      const sets = [];
      const values = [];
      let i = 1;
      for (const key of ['name', 'document', 'thumbnail']) {
        if (key in patch) {
          sets.push(`${key} = $${i++}`);
          values.push(patch[key]);
        }
      }
      if (!sets.length) return this.getProject(id);
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE projects SET ${sets.join(', ')}, updated_at = now()
         WHERE id = $${i} RETURNING ${PROJECT_COLS}`,
        values,
      );
      return rows[0] || null;
    },

    async deleteProject(id) {
      const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      return rowCount > 0;
    },

    async addAsset(projectId, { filename, original, mime, size }) {
      const { rows } = await pool.query(
        `INSERT INTO assets(project_id, filename, original, mime, size)
         VALUES ($1, $2, $3, $4, $5) RETURNING ${ASSET_COLS}`,
        [projectId, filename, original, mime, size],
      );
      return rows[0];
    },

    async listAssets(projectId) {
      const { rows } = await pool.query(
        `SELECT ${ASSET_COLS} FROM assets WHERE project_id = $1 ORDER BY created_at`,
        [projectId],
      );
      return rows;
    },

    async getAsset(id) {
      const { rows } = await pool.query(`SELECT ${ASSET_COLS} FROM assets WHERE id = $1`, [id]);
      return rows[0] || null;
    },

    async deleteAsset(id) {
      const { rows } = await pool.query(
        'DELETE FROM assets WHERE id = $1 RETURNING filename',
        [id],
      );
      return rows[0] || null;
    },
  };
}
