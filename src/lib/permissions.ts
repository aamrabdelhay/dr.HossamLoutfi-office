// نظام الصلاحيات RBAC — جانب الخادم فقط (يقرأ الـcookies)
import { cookies } from "next/headers";
import { ALL_PERMS, ROLES, can } from "./rbac";

export { ROLES, ROLE_LABELS, can } from "./rbac";
export type { Perm, Role } from "./rbac";
import type { Perm, Role } from "./rbac";

export async function getRole(): Promise<Role> {
  const store = await cookies();
  const v = store.get("role")?.value;
  return (ROLES as readonly string[]).includes(v ?? "") ? (v as Role) : "SUPER_ADMIN";
}

export async function getPerms(): Promise<{ role: Role; perms: Record<Perm, boolean> }> {
  const role = await getRole();
  const perms = Object.fromEntries(ALL_PERMS.map((p) => [p, can(role, p)])) as Record<Perm, boolean>;
  return { role, perms };
}

export type LawyerIdentity = { id: number; name: string } | null;

export async function getCurrentLawyer(): Promise<LawyerIdentity> {
  const store = await cookies();
  const id = Number(store.get("lawyerId")?.value ?? "");
  if (!id) return null;
  const name = store.get("lawyerName")?.value ?? "";
  return { id, name: decodeURIComponent(name) };
}
