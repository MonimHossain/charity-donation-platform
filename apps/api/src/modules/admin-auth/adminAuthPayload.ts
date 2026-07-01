import {
  adminRolesFromDbRole,
  effectiveAdminPermissions,
  isSuperAdminRole,
} from "../../constants/adminPermissions.js";
import { Admin } from "../../components/admin/admin.entity.js";

export function buildAdminAuthPayload(admin: Admin) {
  const roles = adminRolesFromDbRole(admin.role);
  const permissions = effectiveAdminPermissions(admin.role, admin.permissions);
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    roles,
    permissions,
    isSuperAdmin: isSuperAdminRole(admin.role),
  };
}
