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
      console.log(`Getting nominas for empresa with RUT: ${rutEmpresa}`);
      
      // First, let's check all nominas to see what we have in the database
      const allNominas = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca LIMIT 10');
      console.log(`Sample nominas in database (first 10): ${allNominas.length}`);
      
      if (allNominas.length > 0) {
        // Log all available fields in the first record
        console.log("First record fields in the database:");
        const firstRecord = allNominas[0];
        console.log(JSON.stringify(firstRecord, null, 2));
      }
      
      // Try different field names since there might be inconsistency
      // Between "RutEmpresa" and "empresa_rut" or other variations
      const query = `
        SELECT * FROM nominabeca 
        WHERE RutEmpresa = ? 
           OR empresa_rut = ? 
           OR \`Rut Empresa\` = ?
      `;
      
      const result = await db.query<DatabaseNomina[]>(query, [
        rutEmpresa, // Try with RutEmpresa 
        rutEmpresa, // Try with empresa_rut
        rutEmpresa  // Try with `Rut Empresa`
      ]);
      
      console.log(`Found ${result.length} nominas for empresa with RUT: ${rutEmpresa}`);
      
      // If still no results, get all nominas as a fallback
      if (result.length === 0) {
        console.log("No results found with filters, falling back to all records for debugging");
        const allRecords = await db.query<DatabaseNomina[]>('SELECT * FROM nominabeca');
        console.log(`Total records in database: ${allRecords.length}`);
        
        if (allRecords.length > 0) {
          // Extract all empresa fields from first 5 records to debug
          console.log("Sample empresa fields from first 5 records:");
          allRecords.slice(0, 5).forEach((record, index) => {
            console.log(`Record #${index + 1}:`, {
              id: record.ID,
              rut: record.Rut,
              RutEmpresa: record.RutEmpresa,
              // Try to access other potential field names
              rutEmpresa: (record as any).rutEmpresa,
              empresa_rut: (record as any).empresa_rut,
              Rut_Empresa: (record as any)['Rut_Empresa'],
              'Rut Empresa': (record as any)['Rut Empresa']
            });
          });
        }
        
        // For now, return all records to avoid empty screens
        // TODO: Remove this fallback once issue is fixed
        return allRecords.map(mapFromDatabase);
      }
      
      // Map and return the results
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
      if (/^\d+$/.test(id)) {
        // It's a numeric ID
        result = await db.query(
          `UPDATE nominabeca SET ? WHERE ID = ?`,
          [setValues, id]
        );
      } else {
        // It's a RUT
        result = await db.query(
          `UPDATE nominabeca SET ? WHERE Rut = ?`,
          [setValues, id]
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
      // Check if id is numeric (ID) or not (RUT)
      if (/^\d+$/.test(id)) {
        // It's a numeric ID
        const result = await db.query('DELETE FROM nominabeca WHERE ID = ?', [id]);
        return result.affectedRows > 0;
      } else {
        // It's a RUT
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