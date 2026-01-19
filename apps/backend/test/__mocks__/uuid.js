/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require('crypto');

module.exports = {
  v4: () => crypto.randomUUID(),
  v1: () => crypto.randomUUID(),
  v3: () => crypto.randomUUID(),
  v5: () => crypto.randomUUID(),
  validate: (uuid) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  },
  version: () => 4,
  NIL: '00000000-0000-0000-0000-000000000000',
};
