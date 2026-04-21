export interface NameParts {
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  secondLastName?: string | null;
}

const normalize = (value?: string | null) => (value ?? '').trim();

export const formatFullName = (parts: NameParts): string => {
  return [
    normalize(parts.firstName),
    normalize(parts.secondName),
    normalize(parts.lastName),
    normalize(parts.secondLastName),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
};

export const parseFullName = (fullName?: string | null): NameParts => {
  const raw = normalize(fullName);
  if (!raw) return {};

  const tokens = raw.split(/\s+/).filter(Boolean);

  if (tokens.length === 1) {
    return { firstName: tokens[0] };
  }

  if (tokens.length === 2) {
    return { firstName: tokens[0], lastName: tokens[1] };
  }

  if (tokens.length === 3) {
    return { firstName: tokens[0], secondName: tokens[1], lastName: tokens[2] };
  }

  return {
    firstName: tokens[0],
    secondName: tokens[1],
    lastName: tokens[2],
    secondLastName: tokens.slice(3).join(' '),
  };
};

export const resolveNameParts = (parts: NameParts, fullName?: string | null) => {
  const parsed = parseFullName(fullName);
  return {
    firstName: normalize(parts.firstName) || normalize(parsed.firstName),
    secondName: normalize(parts.secondName) || normalize(parsed.secondName),
    lastName: normalize(parts.lastName) || normalize(parsed.lastName),
    secondLastName: normalize(parts.secondLastName) || normalize(parsed.secondLastName),
  };
};
