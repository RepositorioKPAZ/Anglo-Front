import { db } from "@/lib/db";
import { NominaRow } from "@/lib/types/user";
import { mapToDatabase, mapFromDatabase, DatabaseNomina } from "@/lib/utils/nomina-mapper";

export interface NominasService {
  getAllNominas(): Promise<NominaRow[]>;
  getNominasByEmpresa(rutEmpresa: string): Promise<NominaRow[]>;
  createNomina(nomina: NominaRow): Promise<NominaRow>;
  updateNomina(id: string, nomina: Partial<NominaRow>): Promise<NominaRow>;
  deleteNomina(id: string): Promise<boolean>;
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

  async updateNomina(id: string, nomina: Partial<NominaRow>): Promise<NominaRow> {
    try {
      const dbNomina = mapToDatabase(nomina as NominaRow);
      
      // Remove undefined properties
      Object.keys(dbNomina).forEach(key => {
        if (dbNomina[key as keyof DatabaseNomina] === undefined) {
          delete dbNomina[key as keyof DatabaseNomina];
        }
      });
      
      // Convert to SQL set format
      const setValues: { [key: string]: any } = {};
      Object.entries(dbNomina).forEach(([key, value]) => {
        if (key !== 'ID' && key !== 'Rut') {  // Don't update primary identifiers
          setValues[key] = value;
        }
      });
      
      // Check if id is numeric (ID) or not (RUT)
      let result;
      
      // Create SET clause string and values array
      const setClauses = Object.keys(setValues).map(key => `${key} = ?`).join(', ');
      const values = Object.values(setValues);
      
      if (/^\d+$/.test(id)) {
        // It's a numeric ID
        values.push(id);
        result = await db.query(
          `UPDATE nominabeca SET ${setClauses} WHERE ID = ?`,
          values
        );
      } else {
        // It's a RUT
        values.push(id);
        result = await db.query(
          `UPDATE nominabeca SET ${setClauses} WHERE Rut = ?`,
          values
        );
      }
      
      if (result.affectedRows === 0) {
        console.warn(`No nomina found with identifier: ${id}`);
        return null as unknown as NominaRow;
      }
      
      // Get the updated record
      let updatedRecord;
      if (/^\d+$/.test(id)) {
        updatedRecord = await db.query('SELECT * FROM nominabeca WHERE ID = ?', [id]);
      } else {
        updatedRecord = await db.query('SELECT * FROM nominabeca WHERE Rut = ?', [id]);
      }
      
      if (updatedRecord && updatedRecord.length > 0) {
        return mapFromDatabase(updatedRecord[0] as DatabaseNomina);
      }
      
      throw new Error(`Updated record not found with identifier: ${id}`);
    } catch (error) {
      console.error("Failed to update nomina in database:", error);
      throw error;
    }
  }

  async deleteNomina(id: string): Promise<boolean> {
    try {
      console.log("DELETE: Deleting nomina with identifier:", id);
      // Check if id is numeric (ID) or not (RUT)
      if (/^\d+$/.test(id)) {
        // It's a numeric ID
        console.log("DELETE: Deleting nomina with ID:", id);
        const result = await db.query('DELETE FROM nominabeca WHERE ID = ?', [id]);
        return result.affectedRows > 0;
      } else {
        // It's a RUT
        console.log("DELETE: Deleting nomina with RUT:", id);
        const result = await db.query('DELETE FROM nominabeca WHERE Rut = ?', [id]);
        return result.affectedRows > 0;
      }
    } catch (error) {
      console.error("Failed to delete nomina from database:", error);
      throw error;
    }
  }
}

// Export the service instance
export const nominasService = new DatabaseNominasService(); 