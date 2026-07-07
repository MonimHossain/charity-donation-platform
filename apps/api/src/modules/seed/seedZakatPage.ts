import type { DataSource } from "typeorm";
import { ZakatPage } from "../../components/cms/zakatPage.entity.js";
import { defaultZakatPagePayload } from "../cms/zakatPage.controller.js";

export async function seedZakatPage(ds: DataSource) {
  const repo = ds.getRepository(ZakatPage);
  const existing = await repo.count();
  if (existing > 0) return;

  await repo.save(repo.create(defaultZakatPagePayload()));
  console.log("Zakat page content seeded");
}
