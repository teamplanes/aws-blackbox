# AWS Blackbox

`new Blackbox()` exposes 2 methods, one for retrieving parameters from AWS
parameter store, and the other for retrieving Secrets from SSM.

When retrieving theses values on a busy lambda function, even if the values are
stored in memory, you'll hit an AWS API rate-limit. Blackbox is the best of both
worlds, it store the values in memory and in redis so that first it'll read from
memory (as fast as can be) and falling back to redis.


### Example:
```ts
import {Blackbox} from 'aws-blackbox';

const blackbox = new Blackbox({
  cache: {
    ttl: 100, // seconds, optional, defaults to 3,600
    // Optional, node-redis options
    redis: {
      host: 'XXX',
      port: 9879,
      auth_pass: 'XXX',
    }
  },
  // Optional, AWS credentials
  credentials: {
    accessKeyId: '123',
    secretAccessKey: '123',
    region: '123',
  }
});

blackbox.onError(e => console.log('Cache error', e))
await blackbox.get('my-key');
await blackbox.set('my-key', 'my-value');
await blackbox.set('my-key', {foo: 'bar'});
```
