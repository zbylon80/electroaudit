// Example test to verify Jest setup
describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify TypeScript is working', () => {
    const greeting: string = 'Hello, ElectroAudit!';
    expect(greeting).toContain('ElectroAudit');
  });
});
