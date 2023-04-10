import { IndexDescription } from 'mongodb'

export const IX__timestamp_addresses: IndexDescription = {
  // eslint-disable-next-line sort-keys-fix/sort-keys-fix
  key: { _timestamp: -1, addresses: 1 },
  name: 'bound_witnesses.IX__timestamp_addresses',
}
