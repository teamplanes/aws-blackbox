export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

const optionsToAwsArgs = (
  credentials?: AWSCredentials | undefined,
):
  | undefined
  | {
      region: string;
      credentials: {accessKeyId: string; secretAccessKey: string};
    } => {
  return credentials
    ? {
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      }
    : undefined;
};

export {optionsToAwsArgs};
