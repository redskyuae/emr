import type { CreateTreatmentInput } from './schemas/treatment-schema';

const abhyangaSession = {
  procedure: 'Abhyanga + Swedana',
  durationMinutes: 60,
  setupMinutes: 10,
  cleaningMinutes: 5,
  preparation: 'Patient to arrive hydrated; remove jewellery before treatment.',
  warning: 'Confirm oil allergy screening before starting.',
  equipment: 'Steam cabinet, warm sesame oil, towels',
  roomType: 'Panchakarma room',
  therapistSkill: 'Abhyanga',
};

export const DEFAULT_TREATMENTS: CreateTreatmentInput[] = [
  {
    name: 'Abhyanga wellness programme',
    code: 'TRT-0400',
    durationMinutes: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    roomType: 'Panchakarma room',
    therapistSkill: 'Abhyanga',
    sessions: [1, 2, 3, 4, 5, 6].map((sessionNumber) => ({
      ...abhyangaSession,
      sessionNumber,
      label: `Session ${sessionNumber} of 6 · Abhyanga + Swedana`,
    })),
  },
  {
    name: 'Shirodhara relaxation programme',
    code: 'TRT-0401',
    durationMinutes: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    roomType: 'Therapy room',
    therapistSkill: 'Shirodhara',
    sessions: [1, 2].map((sessionNumber) => ({
      sessionNumber,
      label: `Session ${sessionNumber} of 4 · Shirodhara`,
      procedure: 'Shirodhara',
      durationMinutes: 60,
      setupMinutes: 10,
      cleaningMinutes: 5,
      preparation: 'Patient to arrive hydrated; remove jewellery before treatment.',
      warning: 'Confirm oil allergy screening before starting.',
      equipment: 'Steam cabinet, warm sesame oil, towels',
      roomType: 'Therapy room',
      therapistSkill: 'Shirodhara',
    })),
  },
];
