import {Cache, CacheOptions} from './cache';
import {getParameters} from './parameters';
import {
  getDatabaseConnectionBySecretsManagerId,
  SSMTemplate,
} from './secrets-manager';
import {AWSCredentials} from './utils';

const toConnectionString = (template: SSMTemplate) => {
  return `${template.engine}://${template.username}:${template.password}@${template.host}/${template.dbname}`;
};

/**
 * e.g.
 *
 * ```ts
 * const blackbox = new Blackbox({
 *   cache: {
 *     ttl: 100, // seconds, optional, defaults to 3,600
 *     // Optional, node-redis options
 *     redis: {
 *       host: 'XXX',
 *       port: 9879,
 *       auth_pass: 'XXX',
 *     }
 *   },
 *   // Optional, AWS credentials
 *   credentials: {
 *     accessKeyId: '123',
 *     secretAccessKey: '123',
 *     region: '123',
 *   }
 * });
 * blackbox.onError(e => console.log('Cache error', e))
 * const params = await blackbox.parameters('/blog/production');
 * const db = await blackbox.secret(process.env.POSTGRES_SECRET_ID);
 * const connectionString = db.toConnectionString();
 * ```
 */
class Blackbox extends Cache {
  private errorCallbacks: ((e: Error) => void)[] = [];

  constructor(
    private options?: {credentials: AWSCredentials; cache?: CacheOptions},
  ) {
    super(options?.cache);
  }

  /**
   * Retrieve a secret from SSM. The return type of this method is an
   * SSMTemplate which may not be correct for your use-case. Please flag in GH
   * issues if you spot this not working correctly.
   * @param key
   */
  public async secret(
    key: string,
  ): Promise<SSMTemplate & {toConnectionString: () => string}> {
    const existing = (await this.get(key).catch((e) => {
      this.errorCallbacks.forEach((cb) => cb(e));
    })) as SSMTemplate;
    if (existing)
      return {
        ...existing,
        toConnectionString() {
          return toConnectionString(this as SSMTemplate);
        },
      };
    const template = await getDatabaseConnectionBySecretsManagerId(key);
    await this.set(key, template).catch((e) => {
      this.errorCallbacks.forEach((cb) => cb(e));
    });
    return {
      ...template,
      toConnectionString() {
        return toConnectionString(this as SSMTemplate);
      },
    };
  }

  /**
   * Retrieve an object of parameters under the given path.
   * @param ssmParameterPath
   */
  public async parameters(
    ssmParameterPath: string,
  ): Promise<Record<string, string>> {
    const existing = await this.get(ssmParameterPath).catch((e) => {
      this.errorCallbacks.forEach((cb) => cb(e));
    });
    if (existing) return existing;
    const parametersObject = await getParameters(ssmParameterPath, {
      credentials: this.options?.credentials,
    });
    await this.set(ssmParameterPath, parametersObject).catch((e) => {
      this.errorCallbacks.forEach((cb) => cb(e));
    });
    return parametersObject;
  }

  /**
   * Listen to cache related errors
   * @param callback
   */
  public onError(callback: (e: Error) => void): void {
    this.errorCallbacks.push(callback);
  }
}

export {Blackbox};
