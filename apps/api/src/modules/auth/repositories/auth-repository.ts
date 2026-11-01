import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
export interface Account {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}
export class AuthRepository {
  constructor(private readonly pool: Pool) {}
  async find(email: string): Promise<Account | undefined> {
    const result = await this.pool.query<Account>(
      'SELECT u.id,u.email,u.password_hash,p.full_name AS name FROM auth.users u JOIN app.profiles p ON p.user_id=u.id WHERE u.email=$1',
      [email],
    );
    return result.rows[0];
  }
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async insertAccount(
    client: PoolClient,
    name: string,
    email: string,
    hash: string,
  ): Promise<Account> {
    const id = randomUUID();
    await client.query('INSERT INTO auth.users(id,email,password_hash) VALUES($1,$2,$3)', [
      id,
      email,
      hash,
    ]);
    await client.query('INSERT INTO app.profiles(id,user_id,full_name) VALUES($1,$1,$2)', [
      id,
      name,
    ]);
    return { id, email, name, password_hash: hash };
  }
  async insertSession(
    client: PoolClient,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const familyId = randomUUID();
    await client.query('INSERT INTO auth.session_families(id,user_id) VALUES($1,$2)', [
      familyId,
      userId,
    ]);
    await client.query(
      'INSERT INTO auth.refresh_tokens(id,family_id,token_hash,expires_at) VALUES($1,$2,$3,$4)',
      [randomUUID(), familyId, tokenHash, expiresAt],
    );
  }
}
