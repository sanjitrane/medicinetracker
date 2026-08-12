import { getGreeting } from '../greeting';

describe('getGreeting', () => {
  const at = (hour: number) => new Date(2026, 7, 12, hour, 0, 0);

  it('greets the morning before noon', () => {
    expect(getGreeting(at(0))).toBe('Good Morning');
    expect(getGreeting(at(11))).toBe('Good Morning');
  });

  it('greets the afternoon from noon until 17:00', () => {
    expect(getGreeting(at(12))).toBe('Good Afternoon');
    expect(getGreeting(at(16))).toBe('Good Afternoon');
  });

  it('greets the evening from 17:00', () => {
    expect(getGreeting(at(17))).toBe('Good Evening');
    expect(getGreeting(at(23))).toBe('Good Evening');
  });
});
