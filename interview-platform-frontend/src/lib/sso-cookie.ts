/**
 * SSO "Remember Last Organization" cookie utility.
 * 
 * After a successful SSO login, the frontend saves the org info in a cookie.
 * On return visits, the login page reads this cookie and shows:
 * "Welcome back — Continue with {Acme Corp SSO}"
 * 
 * This avoids asking the user to re-enter their email every time.
 */

const SSO_COOKIE_NAME = "interview_platform_last_org";
const SSO_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface LastOrgInfo {
  domain: string;
  providerName: string;
  providerType: string;
  loginUrl: string;
  tenantId: string;
}

/**
 * Save the user's last SSO organization after successful login.
 */
export function saveLastOrg(info: LastOrgInfo): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(info));
  document.cookie = `${SSO_COOKIE_NAME}=${value}; path=/; max-age=${SSO_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Retrieve the user's last SSO organization (for auto-detection on return).
 */
export function getLastOrg(): LastOrgInfo | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name === SSO_COOKIE_NAME) {
      try {
        return JSON.parse(decodeURIComponent(rest.join("=")));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear the saved org (e.g., user clicks "Use a different account").
 */
export function clearLastOrg(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SSO_COOKIE_NAME}=; path=/; max-age=0`;
}
