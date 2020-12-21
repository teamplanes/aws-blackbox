import {SecretsManager} from 'aws-sdk';
import {AWSCredentials, optionsToAwsArgs} from './utils';

export interface SSMTemplate {
  password: string;
  dbname: string;
  engine: string;
  port: string;
  host: string;
  username: string;
}

const parseDatabaseSecretString = (secretString: string) => {
  const creds: SSMTemplate = JSON.parse(secretString);
  return creds;
};

const getDatabaseConnectionBySecretsManagerId = async (
  secretsManagerId: string,
  opts?: {credentials?: AWSCredentials},
): Promise<SSMTemplate> => {
  const secretsManager = new SecretsManager(
    optionsToAwsArgs(opts?.credentials),
  );
  const result = await secretsManager
    .getSecretValue({SecretId: secretsManagerId})
    .promise();
  if (!result || !result.SecretString)
    throw new Error('Database secret not found');
  return parseDatabaseSecretString(result.SecretString);
};

export {getDatabaseConnectionBySecretsManagerId};
