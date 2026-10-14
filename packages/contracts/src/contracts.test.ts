import { describe, expect, it, vi } from 'vitest';
import { checkContractCompatibility } from './compat';
import { createEventBus } from './events';

describe('checkContractCompatibility', () => {
  it.each([
    ['1.1.0', '1.1.0', true],
    ['1.0.4', '1.1.0', true],
    ['1.2.0', '1.1.0', false],
    ['2.0.0', '1.1.0', false],
    ['0.9.0', '1.1.0', false],
    ['banana', '1.1.0', false],
  ])('remote %s on host %s -> %s', (remote, host, compatible) => {
    expect(checkContractCompatibility(remote, host).compatible).toBe(compatible);
  });

  it('explains why a newer remote is refused', () => {
    expect(checkContractCompatibility('1.2.0', '1.1.0').reason).toMatch(/deploy the shell first/);
  });
});

describe('createEventBus', () => {
  it('delivers typed events and unsubscribes', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    const off = bus.on('review.advance', handler);
    bus.emit('review.advance', { fromDocumentId: 'DOC-1' });
    off();
    bus.emit('review.advance', { fromDocumentId: 'DOC-2' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ fromDocumentId: 'DOC-1' });
  });

  it('isolates a throwing subscriber from the others', () => {
    const onError = vi.fn();
    const bus = createEventBus(onError);
    const healthy = vi.fn();
    bus.on('document.coded', () => {
      throw new Error('remote bug');
    });
    bus.on('document.coded', healthy);
    bus.emit('document.coded', { documentId: 'DOC-1', decision: 'responsive', privileged: false });
    expect(healthy).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'document.coded');
  });
});
