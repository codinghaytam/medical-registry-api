import { DiagnostiqueRepository } from './diagnostique.repository.js';
import { ApiError } from '../../utils/apiError.js';

interface DiagnostiquePayload {
  type?: string;
  text?: string;
  consultationId?: string;
  medecinId?: string;
}

export class DiagnostiqueService {
  constructor(private readonly repository = new DiagnostiqueRepository()) {}

  list() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const diagnostique = await this.repository.findById(id);
    if (!diagnostique) {
      throw ApiError.notFound('Diagnostique not found');
    }
    return diagnostique;
  }

  create(payload: Required<DiagnostiquePayload>) {
    return this.repository.create({
      type: payload.type!,
      text: payload.text!,
      consultation: { connect: { id: payload.consultationId! } },
      Medecin: payload.medecinId ? { connect: { id: payload.medecinId } } : undefined
    });
  }

  async update(id: string, payload: DiagnostiquePayload) {
    await this.getById(id);
    return this.repository.update(id, {
      type: payload.type,
      text: payload.text,
      consultation: payload.consultationId ? { connect: { id: payload.consultationId } } : undefined,
      Medecin: payload.medecinId ? { connect: { id: payload.medecinId } } : undefined
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
