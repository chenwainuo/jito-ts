import {VersionedTransaction} from '@solana/web3.js';

import {Meta, Packet} from '../../gen/block-engine/packet';
import fnv1a from '@sindresorhus/fnv1a';

import { LRUCache } from 'typescript-lru-cache';

const cache = new LRUCache<number, number>({
  maxSize: 25000,
  entryExpirationTimeInMS: 5000,
});

export const unixTimestampFromDate = (date: Date) => {
  return Math.floor(date.getTime() / 1000);
};

export const deserializeTransactions = (
  packets: Packet[]
): VersionedTransaction[] => {
  return packets
    .filter(p => {
      const hash = Number(fnv1a(p.data, {size: 32}));
      if (cache.has(hash)) {
        return false
      }
      cache.set(hash, hash)
      return true
    }).map(p => {
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
