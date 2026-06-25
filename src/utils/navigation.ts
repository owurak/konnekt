export function isNavigationActive(path: string, itemPath: string) {
  if (itemPath === "/") return path === "/";
  if (itemPath === "/opportunities") return path === "/opportunities" || path.startsWith("/opportunity/");
  if (itemPath.startsWith("/profile")) return path.startsWith("/profile");
  return path === itemPath || path.startsWith(`${itemPath}/`);
}

export function pageTitle(path: string) {
  if (path === "/") return "Home";
  if (path.startsWith("/network")) return "Network";
  if (path.startsWith("/opportunit") || path.startsWith("/opportunity")) return "Opportunities";
  if (path.startsWith("/profile")) return "Profile";
  if (path.startsWith("/notifications")) return "Notifications";
  if (path.startsWith("/messages")) return "Messages";
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/admin")) return "Admin";
  return "Konnekt";
}
