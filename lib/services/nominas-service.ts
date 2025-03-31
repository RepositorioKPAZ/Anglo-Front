import { db } from "@/lib/db";
import { NominaRow } from "@/lib/types/user";
import { mapToDatabase, mapFromDatabase, DatabaseNomina } from "@/lib/utils/nomina-mapper";

export interface NominasService {
  getAllNominas(): Promise<NominaRow[]>;
  getNominasByEmpresa(rutEmpresa: string): Promise<NominaRow[]>;
  createNomina(nomina: NominaRow): Promise<NominaRow>;
  updateNomina(rut: string, nomina: Partial<NominaRow>): Promise<NominaRow>;
  deleteNomina(rut: string): Promise<boolean>;
}

export class DatabaseNominasService implements NominasService {
  async getAllNominas(): Promise<NominaRow[]> {
    try {
      const result = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca');
      return result.map(mapFromDatabase);
    } catch (error) {
      console.error("Failed to fetch nominas from database:", error);
      throw error;
    }
  }

  async getNominasByEmpresa(rutEmpresa: string): Promise<NominaRow[]> {
    try {
      const result = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca WHERE RutEmpresa = ?', [rutEmpresa]);
      return result.map(mapFromDatabase);
    } catch (error) {
      console.error("Failed to fetch nominas by empresa from database:", error);
      throw error;
    }
  }

  async createNomina(nomina: NominaRow): Promise<NominaRow> {
    try {
      const dbNomina = mapToDatabase(nomina);
      await db.query(
        `INSERT INTO nominabeca (
          Rut, NombreCompleto, Email, Celular, 
          RemuneracionMes1, RemuneracionMes2, RemuneracionMes3,
          NroHijos, NombreBeneficiario, RutBeneficiario,
          RelacionTrabajador, EdadBeneficiario, AñoAcademico,
          PromedioNotas, TipoBeca, RazonSocial,
          RutEmpresa, Operacion, NroContrato,
          EncargadoBeca, MailEncargado, TelefonoEncargado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dbNomina.Rut,
          dbNomina.NombreCompleto,
          dbNomina.Email,
          dbNomina.Celular,
          dbNomina.RemuneracionMes1,
          dbNomina.RemuneracionMes2,
          dbNomina.RemuneracionMes3,
          dbNomina.NroHijos,
          dbNomina.NombreBeneficiario,
          dbNomina.RutBeneficiario,
          dbNomina.RelacionTrabajador,
          dbNomina.EdadBeneficiario,
          dbNomina.AñoAcademico,
          dbNomina.PromedioNotas,
          dbNomina.TipoBeca,
          dbNomina.RazonSocial,
          dbNomina.RutEmpresa,
          dbNomina.Operacion,
          dbNomina.NroContrato,
          dbNomina.EncargadoBeca,
          dbNomina.MailEncargado,
          dbNomina.TelefonoEncargado
        ]
      );

      const result = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca WHERE Rut = ?', [dbNomina.Rut]);
      if (!result.length) {
        throw new Error("Failed to create nomina");
      }

      return mapFromDatabase(result[0]);
    } catch (error) {
      console.error("Failed to create nomina in database:", error);
      throw error;
    }
  }

  async updateNomina(rut: string, nomina: Partial<NominaRow>): Promise<NominaRow> {
    try {
      const dbNomina = mapToDatabase(nomina as NominaRow);
      const updates = Object.entries(dbNomina)
        .filter(([key]) => key !== 'ID' && key !== 'Rut')
        .map(([key]) => `${key} = ?`)
        .join(', ');
      
      const values = Object.entries(dbNomina)
        .filter(([key]) => key !== 'ID' && key !== 'Rut')
        .map(([_, value]) => value);
      values.push(rut);

      await db.query(
        `UPDATE nominabeca SET ${updates} WHERE Rut = ?`,
        values
      );

      const updated = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca WHERE Rut = ?', [rut]);
      if (!updated.length) {
        throw new Error("Nomina not found");
      }

      return mapFromDatabase(updated[0]);
    } catch (error) {
      console.error("Failed to update nomina in database:", error);
      throw error;
    }
  }

  async deleteNomina(rut: string): Promise<boolean> {
    try {
      const result = await db.query('DELETE FROM nominabeca WHERE Rut = ?', [rut]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete nomina from database:", error);
      throw error;
    }
  }
}

// Export the service instance
export const nominasService = new DatabaseNominasService(); 