import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { IpfsHashes } from '../database/model/ipfsHashes.entity';
import { RedisOptions } from 'ioredis';
import { PinataConfig } from '@pinata/sdk';

export class ConfigService {
  constructor(private env: { [k: string]: string | undefined }) {}

  public getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }

  public isProduction() {
    const mode = this.getValue('MODE', false);
    return mode != 'LOCAL';
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',

      host: this.getValue('POSTGRES_HOST'),
      port: parseInt(this.getValue('POSTGRES_PORT')),
      username: this.getValue('POSTGRES_USER'),
      password: this.getValue('POSTGRES_PASSWORD'),
      database: this.getValue('POSTGRES_DATABASE'),
      schema: this.getValue('POSTGRES_SCHEMA'),

      entities: [IpfsHashes],

      ssl: this.isProduction(),
    };
  }

  public getRedisConfig(): RedisOptions {
    const redisOpts: RedisOptions = {
      host: this.getValue('REDIS_HOST'),
      password: this.getValue('REDIS_PASSWORD'),
      port: parseInt(this.getValue('REDIS_PORT')),
    };

    if (this.isProduction()) {
      redisOpts.tls = {
        servername: this.getValue('REDIS_HOST'),
      };
    }

    return redisOpts;
  }

  public getPinataConfig(): PinataConfig {
    return {
      pinataApiKey: this.getValue('PINATA_API_KEY'),
      pinataSecretApiKey: this.getValue('PINATA_API_SECRET'),
    };
  }

  public ensureValues(keys: string[]) {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }
}

const configService = new ConfigService(process.env).ensureValues([
  'PINATA_API_KEY',
  'PINATA_API_SECRET',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
  'POSTGRES_SCHEMA',
  'REDIS_HOST',
  'REDIS_PASSWORD',
  'REDIS_PORT',
]);

export { configService };
