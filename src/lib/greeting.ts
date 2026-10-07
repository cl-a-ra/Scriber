export function getGreeting(date: Date): string {
  const hour = date.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export function getGreetingName(displayName: string): string {
  const name = displayName.trim();
  return !name || name === 'Scriber Muse' ? 'dreamer' : name.split(/\s+/)[0];
}
