// Users table schema (minimal: id, email, role)
export const createUsersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`;

export default createUsersTableSQL;


