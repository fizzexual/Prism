import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from '../lib/api.js';
import { syncSave, getServerId } from './persist.js';

const project = { id: 'proj_q', name: 'Q', pages: [{ id: 'p', rootId: 'r' }], instances: { r: { id: 'r', children: [] } } };

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('syncSave', () => {
  it('still saves to the server when local storage is full, and reports where it saved', async () => {
    const realSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (k, v) {
      if (k.startsWith('prismx:project:')) throw new DOMException('quota', 'QuotaExceededError');
      return realSet.call(this, k, v);
    });
    const create = vi.spyOn(api, 'createProject').mockResolvedValue({ id: 'srv-9' });
    const res = await syncSave(project, null);
    expect(create).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ status: 'cloud', serverId: 'srv-9' });
    expect(getServerId('proj_q')).toBe('srv-9');
  });

  it("reports 'error' (not 'local') when local storage is full and the server is unreachable", async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    vi.spyOn(api, 'createProject').mockRejectedValue(new Error('offline'));
    const res = await syncSave({ ...project, id: 'proj_q2' }, null);
    expect(res.status).toBe('error');
  });
});
