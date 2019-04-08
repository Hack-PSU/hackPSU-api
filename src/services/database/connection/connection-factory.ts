import { PoolConnection } from 'mysql2/promise';

export interface IConnectionFactory {
  getConnection(): Promise<PoolConnection>;
}
