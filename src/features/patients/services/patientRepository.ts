import { getDatabase } from '@/database/client';

import type { Patient } from '../types/patient';

/** Repository pattern (architecture.md #27), mirroring `medicineRepository`. */
export interface PatientRepository {
  create(patient: Patient): Promise<void>;
  update(id: string, patient: Patient): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Patient | null>;
  findAllByUserId(userId: string): Promise<Patient[]>;
}

function patientToParams(patient: Patient) {
  return [patient.id, patient.userId, patient.name, patient.phoneNumber, patient.createdAt, patient.updatedAt];
}

export const patientRepository: PatientRepository = {
  async create(patient) {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO patients (id, userId, name, phoneNumber, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?);',
      patientToParams(patient)
    );
  },

  async update(id, patient) {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE patients SET userId = ?, name = ?, phoneNumber = ?, createdAt = ?, updatedAt = ? WHERE id = ?;',
      [...patientToParams(patient).slice(1), id]
    );
  },

  async delete(id) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM patients WHERE id = ?;', [id]);
  },

  async findById(id) {
    const db = await getDatabase();
    return db.getFirstAsync<Patient>('SELECT * FROM patients WHERE id = ?;', [id]);
  },

  async findAllByUserId(userId) {
    const db = await getDatabase();
    return db.getAllAsync<Patient>('SELECT * FROM patients WHERE userId = ? ORDER BY createdAt ASC;', [
      userId,
    ]);
  },
};
