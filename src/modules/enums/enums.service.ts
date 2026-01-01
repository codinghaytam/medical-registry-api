import {
  HygieneBuccoDentaire,
  MotifConsultation,
  TypeMastication
} from '@prisma/client';

export class EnumsService {
  getMotifs() {
    return Object.values(MotifConsultation);
  }

  getMasticationTypes() {
    return Object.values(TypeMastication);
  }

  getHygieneLevels() {
    return Object.values(HygieneBuccoDentaire);
  }
}
