import {VersionedTransaction} from '@solana/web3.js';

import {Meta, Packet} from '../../gen/block-engine/packet';

const { BloomFilter } = require('bloom-filters');
const size = 10000; // Size of the filter
const hashes = 10; // Number of hash functions
const bloom = new BloomFilter(size, hashes);

function addToFilter(byteArray: Uint8Array) {
  const buffer = Buffer.from(byteArray);
  bloom.add(buffer);
}

// Function to check if a byte array is possibly in the Bloom filter
function isInFilter(byteArray: Uint8Array) {
  const buffer = Buffer.from(byteArray);
  return bloom.has(buffer);
}

export const unixTimestampFromDate = (date: Date) => {
  return Math.floor(date.getTime() / 1000);
};

export const deserializeTransactions = (packets: Packet[]): VersionedTransaction[] => {
  return packets.filter(p => {
    // Check if the packet data is in the Bloom filter
    if (isInFilter(p.data)) {
      return false; // Skip this packet if it's likely a duplicate
    }

    // Add packet data to the Bloom filter
    addToFilter(p.data);
    return true;  // Process this packet
  }).map(p => {
    // Deserialize the packet data
    return VersionedTransaction.deserialize(p.data);
  });
};

export const serializeTransactions = (
  txs: VersionedTransaction[]
): Packet[] => {
  return txs.map(tx => {
    const data = tx.serialize();

    return {
      data,
      meta: {
        port: 0,
        addr: '0.0.0.0',
        senderStake: 0,
        size: data.length,
        flags: undefined,
      } as Meta,
    } as Packet;
  });
};

export const isError = <T>(value: T | Error): value is Error => {
  return value instanceof Error;
};
