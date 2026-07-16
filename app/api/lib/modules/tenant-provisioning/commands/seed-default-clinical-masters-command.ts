import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { allergenRepository } from '../../allergen/repository/allergen-repository';
import { clinicalNoteTypeRepository } from '../../clinical-note-type/repository/clinical-note-type-repository';
import { diagnosisCodeRepository } from '../../diagnosis-code/repository/diagnosis-code-repository';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';

const DEFAULT_DIAGNOSIS_CODES = [
  { code: 'I10', title: 'Essential (primary) hypertension', category: 'Circulatory' },
  { code: 'E11', title: 'Type 2 diabetes mellitus', category: 'Endocrine' },
  { code: 'J45', title: 'Asthma', category: 'Respiratory' },
  { code: 'J06', title: 'Acute upper respiratory infection', category: 'Respiratory' },
  { code: 'J02', title: 'Acute pharyngitis', category: 'Respiratory' },
  { code: 'J20', title: 'Acute bronchitis', category: 'Respiratory' },
  { code: 'A09', title: 'Infectious gastroenteritis and colitis', category: 'Infectious' },
  { code: 'K21', title: 'Gastro-oesophageal reflux disease', category: 'Digestive' },
  { code: 'K29', title: 'Gastritis and duodenitis', category: 'Digestive' },
  { code: 'M54', title: 'Dorsalgia (back pain)', category: 'Musculoskeletal' },
  { code: 'M25', title: 'Joint disorder, unspecified', category: 'Musculoskeletal' },
  { code: 'R51', title: 'Headache', category: 'Symptoms' },
  { code: 'R10', title: 'Abdominal and pelvic pain', category: 'Symptoms' },
  { code: 'R50', title: 'Fever of unknown origin', category: 'Symptoms' },
  { code: 'N39', title: 'Urinary tract infection, site not specified', category: 'Genitourinary' },
  { code: 'E78', title: 'Disorders of lipoprotein metabolism', category: 'Endocrine' },
  { code: 'F32', title: 'Depressive episode', category: 'Mental' },
  { code: 'F41', title: 'Anxiety disorder', category: 'Mental' },
  { code: 'L20', title: 'Atopic dermatitis', category: 'Skin' },
  { code: 'H66', title: 'Suppurative and unspecified otitis media', category: 'Ear' },
] as const;

const DEFAULT_ALLERGENS = [
  { name: 'Penicillin', code: 'PCN', category: 'drug' },
  { name: 'Sulfa drugs', code: 'SULFA', category: 'drug' },
  { name: 'Aspirin', code: 'ASA', category: 'drug' },
  { name: 'Ibuprofen', code: 'IBU', category: 'drug' },
  { name: 'Peanuts', code: 'PEANUT', category: 'food' },
  { name: 'Tree nuts', code: 'TREENUT', category: 'food' },
  { name: 'Shellfish', code: 'SHELL', category: 'food' },
  { name: 'Eggs', code: 'EGG', category: 'food' },
  { name: 'Milk', code: 'MILK', category: 'food' },
  { name: 'Pollen', code: 'POLLEN', category: 'environmental' },
  { name: 'Dust mites', code: 'DUST', category: 'environmental' },
  { name: 'Latex', code: 'LATEX', category: 'environmental' },
] as const;

const DEFAULT_CLINICAL_NOTE_TYPES = [
  { name: 'Progress Note', code: 'PROG', description: 'Routine progress note.' },
  { name: 'Consultation', code: 'CONS', description: 'Specialist consultation note.' },
  { name: 'Discharge Summary', code: 'DISCH', description: 'Discharge summary note.' },
  { name: 'Nursing Note', code: 'NURS', description: 'Nursing observation note.' },
] as const;

type DiagnosisCodeSeeder = typeof diagnosisCodeRepository.seedDefaultDiagnosisCodes;
type AllergenSeeder = typeof allergenRepository.seedDefaultAllergens;
type ClinicalNoteTypeSeeder = typeof clinicalNoteTypeRepository.seedDefaultClinicalNoteTypes;

export async function seedDefaultClinicalMastersCommand(
  tenantId: unknown,
  seedDiagnosisCodes: DiagnosisCodeSeeder = diagnosisCodeRepository.seedDefaultDiagnosisCodes,
  seedAllergens: AllergenSeeder = allergenRepository.seedDefaultAllergens,
  seedClinicalNoteTypes: ClinicalNoteTypeSeeder = clinicalNoteTypeRepository.seedDefaultClinicalNoteTypes
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedDiagnosisCodes(tenantIdResult.data, [...DEFAULT_DIAGNOSIS_CODES]);
    await seedAllergens(tenantIdResult.data, [...DEFAULT_ALLERGENS]);
    await seedClinicalNoteTypes(tenantIdResult.data, [...DEFAULT_CLINICAL_NOTE_TYPES]);

    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default clinical masters.'] };
  }
}
