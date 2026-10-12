// Expected format
//
// `{number}{suffix}`...
// Suffix is d or D for day, h or H for hour, m or M for minute, s or S for second.
//
export function durationToMilliseconds(input: string): number {
  const re = /^([0-9]+[Dd])?([0-9]+[Hh])?([0-9]+[Mm])?([0-9]+[Ss])?$/;
  const parsed = re.exec(input);
  if (parsed === null) {
    return NaN;
  }
  let total = 0;
  const [days, hours, minutes, seconds] = parsed.slice(1, 5);

  let valid = false;
  for (const entry of [days, hours, minutes, seconds]) {
    if (entry === undefined) {
      continue;
    }
    const [value, unit] = [parseFloat(entry.slice(0, -1)), entry.slice(-1)];
    if (isNaN(value)) {
      return NaN;
    }

    switch (unit) {
    case 'd':
    case 'D':
      total += value * 24 * 60 * 60 * 1000;
      break;
    case 'h':
    case 'H':
      total += value * 60 * 60 * 1000;
      break;
    case 'm':
    case 'M':
      total += value * 60 * 1000;
      break;
    case 's':
    case 'S':
      total += value * 1000;
      break;
    default:
      return NaN;
    }
    valid = true;
  }
  return valid ? total : NaN;
}
