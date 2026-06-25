export function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Konnekt User"
  )}&background=0B6B3A&color=ffffff&bold=true`;
}

export function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "K").toUpperCase();
}
