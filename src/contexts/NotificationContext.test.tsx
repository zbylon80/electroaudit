import { useNotification } from './NotificationContext';

describe('NotificationContext', () => {
  it('should export useNotification hook', () => {
    expect(useNotification).toBeDefined();
    expect(typeof useNotification).toBe('function');
  });
});
