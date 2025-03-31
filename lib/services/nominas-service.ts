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
      console.log("Fetching all nominas from database");
      const result = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca');
      console.log(`Found ${result.length} nominas in database`);
      
      // Debug: log the first result to check structure
      if (result.length > 0) {
        console.log("Sample database record:", JSON.stringify(result[0], null, 2));
      }
      
      try {
        const mappedResults = result.map(mapFromDatabase);
        console.log(`Successfully mapped ${mappedResults.length} records`);
        
        // Debug: log the first mapped result
        if (mappedResults.length > 0) {
          console.log("Sample mapped record:", JSON.stringify(mappedResults[0], null, 2));
        }
        
        return mappedResults;
      } catch (mappingError) {
        console.error("Error mapping database results:", mappingError);
        // If mapping fails, try to return raw data with basic type conversion
        return result.map(item => ({
          ID: item.ID,
          Rut: item.Rut || "",
          "Nombre Completo": item.NombreCompleto || "",
          Email: item.Email || "",
          Celular: item.Celular || "",
          "Remuneracion Mes 1": Number(item.RemuneracionMes1) || 0,
          "Remuneracion Mes 2": Number(item.RemuneracionMes2) || 0,
          "Remuneracion Mes 3": Number(item.RemuneracionMes3) || 0,
          "Nro Hijos": Number(item.NroHijos) || 0,
          "Nombre Beneficiario": item.NombreBeneficiario || "",
          "Rut Beneficiario": item.RutBeneficiario || "",
          "Relacion con el Trabajador": item.RelacionTrabajador || "",
          "Edad del Beneficiario": Number(item.EdadBeneficiario) || 0,
          "Año Academico": String(item.AñoAcademico) || "",
          "Promedio de Notas": Number(item.PromedioNotas) || 0,
          "Tipo Beca": item.TipoBeca || "",
          "Razon Social": item.RazonSocial || "",
          "Rut Empresa": item.RutEmpresa || "",
          Operacion: item.Operacion || "",
          "Nro Contrato": item.NroContrato || "",
          "Encargado Becas Estudio": item.EncargadoBeca || "",
          "Mail Encargado": item.MailEncargado || "",
          "Telefono Encargado": item.TelefonoEncargado || ""
        })) as NominaRow[];
      }
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
      console.log(`Updating nomina with Rut: ${rut}`);
      console.log("Update data:", JSON.stringify(nomina, null, 2));
      
      // Get the existing record first
      const existingRecords = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca WHERE Rut = ?', [rut]);
      
      if (!existingRecords.length) {
        console.error(`No record found with Rut: ${rut}`);
        throw new Error("Nomina not found");
      }
      
      console.log("Found existing record:", JSON.stringify(existingRecords[0], null, 2));
      
      // Convert the partial update to database format
      const dbNomina = mapToDatabase(nomina as NominaRow);
      
      // Filter out undefined/null values to only update what was provided
      const updateEntries = Object.entries(dbNomina)
        .filter(([key, value]) => key !== 'ID' && key !== 'Rut' && value !== undefined && value !== null);
      
      if (updateEntries.length === 0) {
        console.warn("No valid fields to update");
        return mapFromDatabase(existingRecords[0]); // Return the existing record if nothing to update
      }
      
      const updates = updateEntries.map(([key]) => `${key} = ?`).join(', ');
      const values = updateEntries.map(([_, value]) => value);
      values.push(rut); // Add the rut as the WHERE condition value
      
      console.log(`Executing UPDATE nominabeca SET ${updates} WHERE Rut = ?`);
      console.log("With values:", JSON.stringify(values, null, 2));
      
      await db.query(
        `UPDATE nominabeca SET ${updates} WHERE Rut = ?`,
        values
      );

      const updated = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca WHERE Rut = ?', [rut]);
      if (!updated.length) {
        throw new Error("Failed to retrieve updated nomina");
      }
      
      console.log("Updated record:", JSON.stringify(updated[0], null, 2));
      
      // Map the database record back to the NominaRow format
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