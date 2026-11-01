import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
export interface Account {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}
export interface LockedRefresh {
  id: string;
  familyId: string;
  userId: string;
  email: string;
  name: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
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

  async lockRefresh(client: PoolClient, tokenHash: string): Promise<LockedRefresh | undefined> {
    const reference = await client.query<{ family_id: string }>(
      'SELECT family_id FROM auth.refresh_tokens WHERE token_hash=$1',
      [tokenHash],
    );
    const familyId = reference.rows[0]?.family_id;
    if (familyId === undefined) return undefined;
    await client.query('SELECT id FROM auth.session_families WHERE id=$1 FOR UPDATE', [familyId]);
    const result = await client.query<{
      id: string;
      family_id: string;
      user_id: string;
      email: string;
      full_name: string;
      expires_at: Date;
      used_at: Date | null;
      revoked_at: Date | null;
    }>(
      'SELECT t.id,t.family_id,f.user_id,u.email,p.full_name,t.expires_at,t.used_at,f.revoked_at FROM auth.refresh_tokens t JOIN auth.session_families f ON f.id=t.family_id JOIN auth.users u ON u.id=f.user_id JOIN app.profiles p ON p.user_id=u.id WHERE t.token_hash=$1',
      [tokenHash],
    );
    const row = result.rows[0];
    if (row === undefined) return undefined;
    return {
      id: row.id,
      familyId: row.family_id,
      userId: row.user_id,
      email: row.email,
      name: row.full_name,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      revokedAt: row.revoked_at,
    };
  }

  async rotateRefresh(client: PoolClient, token: LockedRefresh, nextHash: string): Promise<void> {
    await client.query('UPDATE auth.refresh_tokens SET used_at=now() WHERE id=$1', [token.id]);
    await client.query(
      'INSERT INTO auth.refresh_tokens(id,family_id,token_hash,expires_at) VALUES($1,$2,$3,$4)',
      [randomUUID(), token.familyId, nextHash, token.expiresAt],
    );
  }

  async revokeFamily(client: PoolClient, familyId: string): Promise<void> {
    await client.query(
      'UPDATE auth.session_families SET revoked_at=COALESCE(revoked_at,now()) WHERE id=$1',
      [familyId],
    );
  }
}
