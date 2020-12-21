import {SSM} from 'aws-sdk';
import * as path from 'path';
import {AWSCredentials, optionsToAwsArgs} from './utils';

interface SecretsOptions {
  credentials?: AWSCredentials;
}

/**
 * Returns an object of parameters stored under the paths.
 * @param paths
 * @param opts
 */
const getParameters = async (
  ssmPath: string,
  opts?: SecretsOptions,
): Promise<Record<string, string>> => {
  const parameterFromPath = async (
    nextToken: string | undefined,
    params?: Record<string, string>,
  ): Promise<Record<string, string>> => {
    const ssm = new SSM(optionsToAwsArgs(opts?.credentials));
    const result = await ssm
      .getParametersByPath({
        Path: ssmPath,
        NextToken: nextToken,
        WithDecryption: true,
        Recursive: false,
      })
      .promise();
    const newParams = {
      ...params,
      ...Object.fromEntries(
        result.Parameters?.map((param) => [
          path.basename(param.Name as string),
          param.Value as string,
        ]) || [],
      ),
    };
    if (result.NextToken && result.Parameters && result.Parameters.length)
      return parameterFromPath(result.NextToken, newParams);
    return newParams;
  };
  return parameterFromPath(undefined);
};

export {getParameters};
