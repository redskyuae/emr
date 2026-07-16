import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { appointmentCancelledReason as appointmentCancelledReasonTable } from '@/app/db/schema/appointment-cancelled-reason';
import { appointmentMode as appointmentModeTable } from '@/app/db/schema/appointment-mode';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { appointmentType as appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { assetCategory as assetCategoryTable } from '@/app/db/schema/asset-category';
import { assetCondition as assetConditionTable } from '@/app/db/schema/asset-condition';
import { assetStatus as assetStatusTable } from '@/app/db/schema/asset-status';
import { organization } from '@/app/db/schema/auth';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { workOrderPriority as workOrderPriorityTable } from '@/app/db/schema/work-order-priority';
import { workOrderStatus as workOrderStatusTable } from '@/app/db/schema/work-order-status';
import { workOrderType as workOrderTypeTable } from '@/app/db/schema/work-order-type';

import { tenantProvisioningRepository } from './tenant-provisioning-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createTestOrganization = async (id: string, name: string, slug: string) => {
  await db.insert(organization).values({
    id,
    name,
    slug,
    logo: null,
    createdAt: new Date(),
    metadata: JSON.stringify({ isActive: true }),
  });
};

const seedAppointmentMasterRows = async (tenantId: string) => {
  await db.insert(appointmentModeTable).values({ tenantId, name: 'In-person', code: 'INP' });
  await db.insert(appointmentTypeTable).values({ tenantId, name: 'New Consultation', code: 'NEW' });
  await db
    .insert(appointmentStatusTable)
    .values({ tenantId, name: 'Scheduled', code: 'SCH', category: 'SCHEDULED' });
  await db.insert(appointmentReasonTable).values({ tenantId, name: 'Consultation', code: 'CONS' });
  await db
    .insert(appointmentCancelledReasonTable)
    .values({ tenantId, name: 'Patient Request', code: 'PATR' });
};

const seedAssetMasterRows = async (tenantId: string) => {
  await db
    .insert(assetCategoryTable)
    .values({ tenantId, name: 'Imaging', code: 'IMG', color: '#2563EB' });
  await db
    .insert(assetConditionTable)
    .values({ tenantId, name: 'Good', code: 'GOOD', color: '#16A34A' });
  await db
    .insert(assetStatusTable)
    .values({ tenantId, name: 'Active', code: 'ACT', color: '#16A34A' });
};

const seedWorkOrderMasterRows = async (tenantId: string) => {
  await db
    .insert(workOrderTypeTable)
    .values({ tenantId, name: 'Preventive', code: 'PREV', color: '#2563EB' });
  await db
    .insert(workOrderPriorityTable)
    .values({ tenantId, name: 'Low', code: 'LOW', color: '#6B7280' });
  await db
    .insert(workOrderStatusTable)
    .values({ tenantId, name: 'Open', code: 'OPEN', category: 'OPEN', color: '#6B7280' });
};

describe('TenantProvisioning repository', () => {
  describe('hasSeededSpecialties', () => {
    it('should report specialties as not seeded for a tenant with no rows', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');

      await expect(tenantProvisioningRepository.hasSeededSpecialties(tenantA)).resolves.toBe(false);
    });

    it('should report specialties as seeded when the tenant has a row, including a soft-deleted row', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await db.insert(specialtyTable).values({
        tenantId: tenantA,
        name: 'Cardiology',
        code: 'CARD',
        isDeleted: true,
        deletedOn: new Date(),
      });

      await expect(tenantProvisioningRepository.hasSeededSpecialties(tenantA)).resolves.toBe(true);
    });

    it("should not count another tenant's specialties as seeded", async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await createTestOrganization(tenantB, 'Hospital B', 'hospital-b');
      await db
        .insert(specialtyTable)
        .values({ tenantId: tenantB, name: 'Cardiology', code: 'CARD' });

      await expect(tenantProvisioningRepository.hasSeededSpecialties(tenantA)).resolves.toBe(false);
    });
  });

  describe('hasSeededAppointmentMasters', () => {
    it('should report appointment masters as not seeded for a tenant with no rows', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');

      await expect(tenantProvisioningRepository.hasSeededAppointmentMasters(tenantA)).resolves.toBe(
        false
      );
    });

    it('should report appointment masters as seeded when every appointment master table has a row', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await seedAppointmentMasterRows(tenantA);

      await expect(tenantProvisioningRepository.hasSeededAppointmentMasters(tenantA)).resolves.toBe(
        true
      );
    });

    it('should report appointment masters as not seeded when only some appointment master tables have rows', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await db
        .insert(appointmentModeTable)
        .values({ tenantId: tenantA, name: 'In-person', code: 'INP' });

      await expect(tenantProvisioningRepository.hasSeededAppointmentMasters(tenantA)).resolves.toBe(
        false
      );
    });

    it('should count soft-deleted rows when deciding whether masters are seeded', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await seedAppointmentMasterRows(tenantA);
      await db
        .update(appointmentModeTable)
        .set({ isDeleted: true, deletedOn: new Date() })
        .where(eq(appointmentModeTable.tenantId, tenantA));

      await expect(tenantProvisioningRepository.hasSeededAppointmentMasters(tenantA)).resolves.toBe(
        true
      );
    });

    it('should not count another tenant rows as seeded masters', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await createTestOrganization(tenantB, 'Hospital B', 'hospital-b');
      await seedAppointmentMasterRows(tenantB);

      await expect(tenantProvisioningRepository.hasSeededAppointmentMasters(tenantA)).resolves.toBe(
        false
      );
    });
  });

  describe('hasSeededAssetMasters', () => {
    it('should report asset masters as not seeded for a tenant with no rows', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');

      await expect(tenantProvisioningRepository.hasSeededAssetMasters(tenantA)).resolves.toBe(
        false
      );
    });

    it('should report asset masters as seeded when every asset master table has a row', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await seedAssetMasterRows(tenantA);

      await expect(tenantProvisioningRepository.hasSeededAssetMasters(tenantA)).resolves.toBe(true);
    });
  });

  describe('hasSeededWorkOrderMasters', () => {
    it('should report work order masters as not seeded for a tenant with no rows', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');

      await expect(tenantProvisioningRepository.hasSeededWorkOrderMasters(tenantA)).resolves.toBe(
        false
      );
    });

    it('should report work order masters as seeded when every work order master table has a row', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await seedWorkOrderMasterRows(tenantA);

      await expect(tenantProvisioningRepository.hasSeededWorkOrderMasters(tenantA)).resolves.toBe(
        true
      );
    });

    it('should report work order masters as not seeded when priorities and statuses are missing', async () => {
      await createTestOrganization(tenantA, 'Hospital A', 'hospital-a');
      await db
        .insert(workOrderTypeTable)
        .values({ tenantId: tenantA, name: 'Preventive', code: 'PREV', color: '#2563EB' });

      await expect(tenantProvisioningRepository.hasSeededWorkOrderMasters(tenantA)).resolves.toBe(
        false
      );
    });
  });
});
