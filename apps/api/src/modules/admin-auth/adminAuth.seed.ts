import bcrypt from "bcryptjs";
import { AppDataSource } from "../../helper/connectDB.js";
import { Admin } from "../../components/admin/admin.entity.js";

export async function seedAdminUser() {
  const repo = AppDataSource.getRepository(Admin);
  const email = process.env.ADMIN_EMAIL ?? "admin@charityplatform.org";
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const existing = await repo.findOne({ where: { email } });

  if (existing) {
    const stillValid = await bcrypt.compare(password, existing.passwordHash);
    if (!stillValid) {
      existing.passwordHash = await bcrypt.hash(password, 12);
      existing.fullName = process.env.ADMIN_FULL_NAME ?? existing.fullName;
      await repo.save(existing);
      console.log("Admin password updated:", email);
    }
    return existing;
  }

  const admin = repo.create({
    email,
    fullName: process.env.ADMIN_FULL_NAME ?? "Platform Admin",
    passwordHash: await bcrypt.hash(password, 12),
    role: "super_admin",
  });
  await repo.save(admin);
  console.log("Admin user seeded:", email);
  return admin;
}
