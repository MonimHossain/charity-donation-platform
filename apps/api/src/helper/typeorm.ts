import type { DeepPartial, ObjectLiteral, Repository } from "typeorm";

export function createEntity<T extends ObjectLiteral>(repo: Repository<T>, data: unknown): T {
  return repo.create(data as DeepPartial<T>);
}
