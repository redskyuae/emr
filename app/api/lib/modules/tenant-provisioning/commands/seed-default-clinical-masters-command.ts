import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { allergenRepository } from '../../allergen/repository/allergen-repository';
import { ayurvedaDiagnosisCodeRepository } from '../../ayurveda-diagnosis-code/repository/ayurveda-diagnosis-code-repository';
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

// Starter Ayurveda Diagnosis Codes, left unmapped to ICD-10-CM. The AYU- codes are local
// identifiers, not NAMASTE or ICD-11 TM2 codes; each Tenant maps or replaces them in Clinical
// Masters. Keep in sync with the 0079 backfill migration.
const DEFAULT_AYURVEDA_DIAGNOSIS_CODES = [
  { code: 'AYU-JVARA', name: 'Jvara', englishName: 'Fever', category: 'General' },
  { code: 'AYU-PANDU', name: 'Pandu', englishName: 'Anaemia', category: 'General' },
  { code: 'AYU-KASA', name: 'Kasa', englishName: 'Cough', category: 'Respiratory' },
  { code: 'AYU-SHVASA', name: 'Shvasa', englishName: 'Dyspnoea', category: 'Respiratory' },
  {
    code: 'AYU-PRATISHYAYA',
    name: 'Pratishyaya',
    englishName: 'Rhinitis',
    category: 'Respiratory',
  },
  {
    code: 'AYU-AGNIMANDYA',
    name: 'Agnimandya',
    englishName: 'Impaired digestion',
    category: 'Digestive',
  },
  { code: 'AYU-AJIRNA', name: 'Ajirna', englishName: 'Indigestion', category: 'Digestive' },
  { code: 'AYU-AMLAPITTA', name: 'Amlapitta', englishName: 'Hyperacidity', category: 'Digestive' },
  {
    code: 'AYU-GRAHANI',
    name: 'Grahani',
    englishName: 'Malabsorption disorders',
    category: 'Digestive',
  },
  { code: 'AYU-ATISARA', name: 'Atisara', englishName: 'Diarrhoea', category: 'Digestive' },
  { code: 'AYU-VIBANDHA', name: 'Vibandha', englishName: 'Constipation', category: 'Digestive' },
  { code: 'AYU-ARSHA', name: 'Arsha', englishName: 'Haemorrhoids', category: 'Digestive' },
  { code: 'AYU-KAMALA', name: 'Kamala', englishName: 'Jaundice', category: 'Digestive' },
  {
    code: 'AYU-AMAVATA',
    name: 'Amavata',
    englishName: 'Rheumatoid arthritis',
    category: 'Musculoskeletal',
  },
  {
    code: 'AYU-SANDHIVATA',
    name: 'Sandhivata',
    englishName: 'Osteoarthritis',
    category: 'Musculoskeletal',
  },
  { code: 'AYU-VATARAKTA', name: 'Vatarakta', englishName: 'Gout', category: 'Musculoskeletal' },
  {
    code: 'AYU-GRIDHRASI',
    name: 'Gridhrasi',
    englishName: 'Sciatica',
    category: 'Musculoskeletal',
  },
  {
    code: 'AYU-KATIGRAHA',
    name: 'Katigraha',
    englishName: 'Low back stiffness',
    category: 'Musculoskeletal',
  },
  {
    code: 'AYU-MANYASTAMBHA',
    name: 'Manyastambha',
    englishName: 'Neck stiffness',
    category: 'Musculoskeletal',
  },
  {
    code: 'AYU-AVABAHUKA',
    name: 'Avabahuka',
    englishName: 'Frozen shoulder',
    category: 'Musculoskeletal',
  },
  {
    code: 'AYU-PAKSHAGHATA',
    name: 'Pakshaghata',
    englishName: 'Hemiplegia',
    category: 'Neurological',
  },
  { code: 'AYU-ARDITA', name: 'Ardita', englishName: 'Facial palsy', category: 'Neurological' },
  {
    code: 'AYU-ARDHAVABHEDAKA',
    name: 'Ardhavabhedaka',
    englishName: 'Migraine',
    category: 'Neurological',
  },
  {
    code: 'AYU-PRAMEHA',
    name: 'Prameha',
    englishName: 'Urinary and metabolic disorders',
    category: 'Metabolic',
  },
  {
    code: 'AYU-MADHUMEHA',
    name: 'Madhumeha',
    englishName: 'Diabetes mellitus',
    category: 'Metabolic',
  },
  { code: 'AYU-STHAULYA', name: 'Sthaulya', englishName: 'Obesity', category: 'Metabolic' },
  { code: 'AYU-KUSHTHA', name: 'Kushtha', englishName: 'Skin disorders', category: 'Skin' },
  { code: 'AYU-VICHARCHIKA', name: 'Vicharchika', englishName: 'Eczema', category: 'Skin' },
  { code: 'AYU-SHVITRA', name: 'Shvitra', englishName: 'Vitiligo', category: 'Skin' },
  { code: 'AYU-MUTRAKRICHRA', name: 'Mutrakrichra', englishName: 'Dysuria', category: 'Urinary' },
  { code: 'AYU-ASHMARI', name: 'Ashmari', englishName: 'Urinary calculi', category: 'Urinary' },
  { code: 'AYU-ANIDRA', name: 'Anidra', englishName: 'Insomnia', category: 'Mental' },
  { code: 'AYU-CHITTODVEGA', name: 'Chittodvega', englishName: 'Anxiety', category: 'Mental' },
  {
    code: 'AYU-KASHTARTAVA',
    name: 'Kashtartava',
    englishName: 'Dysmenorrhoea',
    category: "Women's health",
  },
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
type AyurvedaDiagnosisCodeSeeder =
  typeof ayurvedaDiagnosisCodeRepository.seedDefaultAyurvedaDiagnosisCodes;
type ClinicalNoteTypeSeeder = typeof clinicalNoteTypeRepository.seedDefaultClinicalNoteTypes;

export async function seedDefaultClinicalMastersCommand(
  tenantId: unknown,
  seedDiagnosisCodes: DiagnosisCodeSeeder = diagnosisCodeRepository.seedDefaultDiagnosisCodes,
  seedAllergens: AllergenSeeder = allergenRepository.seedDefaultAllergens,
  seedClinicalNoteTypes: ClinicalNoteTypeSeeder = clinicalNoteTypeRepository.seedDefaultClinicalNoteTypes,
  seedAyurvedaDiagnosisCodes: AyurvedaDiagnosisCodeSeeder = ayurvedaDiagnosisCodeRepository.seedDefaultAyurvedaDiagnosisCodes
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  try {
    await seedDiagnosisCodes(tenantIdResult.data, [...DEFAULT_DIAGNOSIS_CODES]);
    await seedAllergens(tenantIdResult.data, [...DEFAULT_ALLERGENS]);
    await seedClinicalNoteTypes(tenantIdResult.data, [...DEFAULT_CLINICAL_NOTE_TYPES]);
    await seedAyurvedaDiagnosisCodes(tenantIdResult.data, [...DEFAULT_AYURVEDA_DIAGNOSIS_CODES]);

    return { success: true, data: undefined };
  } catch {
    return { success: false, errors: ['Failed to seed default clinical masters.'] };
  }
}
