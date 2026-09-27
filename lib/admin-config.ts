// Accept a raw dashboard value or a single copied KEY=value line.
// Never interpret arbitrary dotenv files or accept plaintext passwords.
export function adminEnv(name: string) {
  let value = (process.env[name] ?? "").trim();
  if (value.startsWith(name + "=")) value = value.slice(name.length + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
    value = value.slice(1, -1);
  return value.trim();
}
export function adminConfig() {
  const email = adminEnv("ADMIN_EMAIL").toLowerCase();
  const passwordHash = adminEnv("ADMIN_PASSWORD_HASH").replace(/\\\$/g, "$");
  const secret = adminEnv("NEXTAUTH_SECRET");
  const issues: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push("ADMIN_EMAIL");
  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash))
    issues.push("ADMIN_PASSWORD_HASH");
  if (secret.length < 32 || /[\r\n]/.test(secret))
    issues.push("NEXTAUTH_SECRET");
  return { email, passwordHash, secret, issues };
}
