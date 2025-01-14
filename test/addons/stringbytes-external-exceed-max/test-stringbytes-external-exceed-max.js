'use strict';

const common = require('../../common');
const skipMessage = 'intensive toString tests due to memory confinements';
if (!common.enoughTestMem)
  common.skip(skipMessage);

// See https://github.com/nodejs/build/issues/1820#issuecomment-505998851
// See https://github.com/nodejs/node/pull/28469
if (process.platform === 'aix')
  common.skip('flaky on AIX');

const binding = require(`./build/${common.buildType}/binding`);

// v8 fails silently if string length > v8::String::kMaxLength
// v8::String::kMaxLength defined in v8.h
const kStringMaxLength = require('buffer').constants.MAX_STRING_LENGTH;

let buf;
try {
  buf = Buffer.allocUnsafe(kStringMaxLength * 2 + 2);
} catch (e) {
  // If the exception is not due to memory confinement then rethrow it.
  if (e.message !== 'Array buffer allocation failed') throw (e);
  common.skip(skipMessage);
}

// Ensure we have enough memory available for future allocations to succeed.
if (!binding.ensureAllocation(2 * kStringMaxLength))
  common.skip(skipMessage);

const stringLengthHex = kStringMaxLength.toString(16);

common.expectsError(function() {
  buf.toString('utf16le');
}, {
  message: `Cannot create a string longer than 0x${stringLengthHex} ` +
           'characters',
  code: 'ERR_STRING_TOO_LONG',
  type: Error
});
