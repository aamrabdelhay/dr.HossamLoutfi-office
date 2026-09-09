// ثوابت الأدوار والصلاحيات — نقي، آمن للاستخدام في العميل والخادم
export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OFFICE_MANAGER",
  "LAWYER",
  "SECRETARY",
  "VIEWER",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "مدير عام",
  ADMIN: "مدير",
  OFFICE_MANAGER: "مدير مكتب",
  LAWYER: "محامي",
  SECRETARY: "سكرتارية",
  VIEWER: "قارئ",
};

export type Perm =
  | "manageUsers"
  | "manageLawyers"
  | "manageLocations"
  | "manageClients"
  | "manageTasks"
  | "manageReminders"
  | "comment"
  | "adminAccess";

export const ALL_PERMS: Perm[] = [
  "manageUsers",
  "manageLawyers",
  "manageLocations",
  "manageClients",
  "manageTasks",
  "manageReminders",
  "comment",
  "adminAccess",
];

const MATRIX: Record<Role, Perm[]> = {
  SUPER_ADMIN: ALL_PERMS,
  ADMIN: ALL_PERMS,
  OFFICE_MANAGER: [
    "manageLawyers",
    "manageLocations",
    "manageClients",
    "manageTasks",
    "manageReminders",
    "comment",
    "adminAccess",
  ],
  LAWYER: ["manageTasks", "manageReminders", "comment"],
  SECRETARY: ["manageLocations", "manageClients", "manageTasks", "manageReminders", "comment", "adminAccess"],
  VIEWER: [],
};

export function can(role: Role, perm: Perm): boolean {
  return MATRIX[role].includes(perm);
}
