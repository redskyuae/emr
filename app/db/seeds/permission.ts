import { permissionRepository } from '@/app/api/lib/modules/permission/repository/permission-repository';
import { permissionSeedData } from '@/app/api/lib/modules/permission/seed-data';

export { permissionSeedData };

export async function seedPermissions() {
  await permissionRepository.seedPermissionCatalogue();
}

if (process.argv[1]?.endsWith('permission.ts')) {
  seedPermissions()
    .then(() => {
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
