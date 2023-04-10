import { IndexDescription } from 'mongodb'

export const IX__timestamp: IndexDescription = {
  // eslint-disable-next-line sort-keys-fix/sort-keys-fix
  key: { _timestamp: 1 },
  name: 'payloads.IX__timestamp',
}
