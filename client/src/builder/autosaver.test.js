import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAutosaver } from './autosaver.js';

const proj = (id, text = 'x') => ({ id, name: id, text });
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

describe('createAutosaver', () => {
  beforeEach(() => vi.useFakeTimers());

  function setup(overrides = {}) {
    const calls = { local: [], save: [], status: [], serverId: [] };
    const ids = {};
    const saver = createAutosaver({
      delay: 800,
      saveLocalNow: (p) => calls.local.push(p),
      save: async (p, sid) => { calls.save.push({ p, sid }); return { status: 'cloud', serverId: sid || `srv-${p.id}` }; },
      getServerId: (id) => ids[id] || null,
      rememberServerId: (id, sid) => { ids[id] = sid; },
      getCurrentId: () => overrides.current?.() ?? null,
      onStatus: (s) => calls.status.push(s),
      onServerId: (s) => calls.serverId.push(s),
      ...overrides.opts,
    });
    return { saver, calls, ids };
  }

  it('flush() writes the pending edit to local storage immediately (no edit lost on reload)', () => {
    const { saver, calls } = setup();
    saver.schedule(proj('A', 'edited'));
    saver.flush();
    expect(calls.local.map((p) => p.text)).toEqual(['edited']);
  });

  it('flush() with nothing pending writes nothing', () => {
    const { saver, calls } = setup();
    saver.flush();
    expect(calls.local).toEqual([]);
  });

  it('debounces: several quick edits produce one save of the latest version', async () => {
    const { saver, calls } = setup();
    saver.schedule(proj('A', '1'));
    saver.schedule(proj('A', '2'));
    saver.schedule(proj('A', '3'));
    await vi.advanceTimersByTimeAsync(900);
    expect(calls.save.map((c) => c.p.text)).toEqual(['3']);
  });

  it('switching project flushes the old project instead of dropping its last edit', async () => {
    const { saver, calls } = setup();
    saver.schedule(proj('A', 'last-A-edit'));
    saver.schedule(proj('B', 'b'));
    expect(calls.local.map((p) => p.text)).toContain('last-A-edit');
    await vi.advanceTimersByTimeAsync(900);
    expect(calls.save.map((c) => c.p.id)).toEqual(['A', 'B']);
  });

  it('serializes saves so a slow first create is not duplicated by the next save', async () => {
    const gate = deferred();
    const created = [];
    const { saver, ids } = setup({
      opts: {
        save: async (p, sid) => {
          if (!sid) { created.push(p.text); await gate.promise; return { status: 'cloud', serverId: 'srv-1' }; }
          return { status: 'cloud', serverId: sid };
        },
      },
    });
    saver.schedule(proj('A', 'first'));
    await vi.advanceTimersByTimeAsync(900); // first save starts, blocks on gate
    saver.schedule(proj('A', 'second'));
    await vi.advanceTimersByTimeAsync(900); // second save must wait
    gate.resolve();
    await vi.advanceTimersByTimeAsync(10);
    expect(created).toEqual(['first']);
    expect(ids.A).toBe('srv-1');
  });

  it('ignores a late result for a project the user already left', async () => {
    const gate = deferred();
    let current = 'A';
    const { saver, calls } = setup({
      current: () => current,
      opts: { save: async (p) => { await gate.promise; return { status: 'cloud', serverId: `srv-${p.id}` }; } },
    });
    saver.schedule(proj('A'));
    await vi.advanceTimersByTimeAsync(900);
    current = 'B';
    gate.resolve();
    await vi.advanceTimersByTimeAsync(10);
    expect(calls.serverId).toEqual([]);
    expect(calls.status).toEqual(['saving']);
  });

  it('a save that throws reports an error status instead of spinning forever', async () => {
    const { saver, calls } = setup({ current: () => 'A', opts: { save: async () => { throw new Error('boom'); } } });
    saver.schedule(proj('A'));
    await vi.advanceTimersByTimeAsync(900);
    expect(calls.status.at(-1)).toBe('error');
  });

  it('a local write that throws during flush does not throw out of flush', () => {
    const { saver } = setup({ opts: { saveLocalNow: () => { throw new Error('QuotaExceededError'); } } });
    saver.schedule(proj('A'));
    expect(() => saver.flush()).not.toThrow();
  });
});
