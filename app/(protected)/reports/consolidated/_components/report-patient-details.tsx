import type { ConsolidatedPatientReport } from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';

import {
  ageAndSex,
  displayDateIn,
  displayPlace,
  patientFullName,
} from '../../_utils/consolidated-report-format';
import { ReportSectionHeading } from './report-document-parts';

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-[10px] font-semibold tracking-[0.08em] uppercase">
        {label}
      </dt>
      <dd className={mono ? 'mt-0.5 font-mono text-[12.5px]' : 'mt-0.5 text-[12.5px] font-medium'}>
        {value}
      </dd>
    </div>
  );
}

/** Patient identity and the consulting Doctor, then the period's diagnoses and complaint. */
export function ReportPatientDetails({ report }: { report: ConsolidatedPatientReport }) {
  const { patient, consultingDoctor, diagnoses } = report;

  return (
    <section className="break-inside-avoid">
      <ReportSectionHeading title="Patient details" />
      <dl className="bg-muted/50 border-border grid grid-cols-2 gap-x-6 gap-y-3.5 rounded-lg border px-4 py-3.5 sm:grid-cols-3">
        <Detail label="Patient name" value={patientFullName(patient)} />
        <Detail label="MRN" value={patient.mrn} mono />
        <Detail
          label="Age / Sex"
          value={ageAndSex(patient.dateOfBirth, patient.gender, report.period.toDate)}
        />
        <Detail label="Phone" value={patient.phone} />
        <Detail label="Address" value={displayPlace(patient.city, patient.state)} />
        <Detail label="Blood group" value={patient.bloodGroup ?? '—'} />
        <Detail
          label="Registered on"
          value={displayDateIn(patient.registeredOn, report.timeZone)}
        />
        <Detail label="Consulting Doctor" value={consultingDoctor?.name ?? '—'} />
      </dl>

      <div className="mt-4 space-y-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.08em] uppercase">
          Diagnosis
        </p>
        {diagnoses.length > 0 ? (
          <ul className="space-y-0.5 text-[12.5px] font-semibold">
            {diagnoses.map((diagnosis) => (
              <li key={`${diagnosis.codeSystem}:${diagnosis.code}`}>
                {diagnosis.title}
                {diagnosis.englishName ? ` – ${diagnosis.englishName}` : ''}{' '}
                <span className="text-muted-foreground font-mono text-[11px] font-normal">
                  {diagnosis.code}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-[12px]">No diagnosis recorded in this period.</p>
        )}
        {report.chiefComplaint ? (
          <p className="text-muted-foreground text-[11.5px]">
            Chief complaint: {report.chiefComplaint}
          </p>
        ) : null}
      </div>
    </section>
  );
}
