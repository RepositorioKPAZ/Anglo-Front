require('dotenv').config({ path: '.env.local' });
const { executeQuery } = require('../app/api/db-connection');
const { findUserByRutInDb } = require('../lib/services/database-service');

async function migrateUsers(users) {
  console.log('\nMigrating users...');
  console.log(`Found ${users.length} users to migrate`);

  let successCount = 0;
  for (const user of users) {
    try {
      const existingUser = await findUserByRutInDb(user.Rut);
      if (!existingUser) {
        await executeQuery(
          `INSERT INTO empresacontacto (
            ID, Rut, Empresa, Operacion, Encargado, Mail, Telefono, Empresa_C
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.ID,
            user.Rut,
            user.Empresa,
            user.Operacion,
            user.Encargado,
            user.Mail,
            user.Telefono,
            user.Empresa_C
          ]
        );
        successCount++;
      }
    } catch (error) {
      console.error(`Error migrating user ${user.Rut}:`, error);
    }
  }
  console.log(`Successfully migrated ${successCount} out of ${users.length} users`);
}

async function migrateNominas(nominas) {
  console.log('\nMigrating nominas...');
  console.log(`Found ${nominas.length} nominas to migrate`);

  let successCount = 0;
  for (const nomina of nominas) {
    try {
      await executeQuery(
        `INSERT INTO nominabeca (
          Rut, Nombre_Completo, Email, Celular, 
          Remuneracion_Mes_1, Remuneracion_Mes_2, Remuneracion_Mes_3,
          Anios_Mesa, Ingreso_Percapita, Relacion_Trabajador,
          Tipo_Beneficiario, Promedio_Notas, Anios_Antiguedad,
          empresa_rut, Nombre_Empresa, Cod_Plan,
          Anio_Postulacion, Rut_Beneficiario, Nombre_Beneficiario,
          Direccion, Comuna, Sucursal, Cargo,
          Nro_Hijos, Edad_Beneficiario, Ano_Academico,
          Tipo_Beca, Razon_Social, Operacion,
          Nro_Contrato, Encargado_Becas_Estudio,
          Mail_Encargado, Telefono_Encargado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nomina.Rut,
          nomina["Nombre Completo"],
          nomina.Email,
          nomina.Celular,
          nomina["Remuneracion Mes 1"],
          nomina["Remuneracion Mes 2"],
          nomina["Remuneracion Mes 3"],
          nomina["Años Mesa"],
          nomina["Ingreso Percapita"],
          nomina["Relacion con el Trabajador"],
          nomina["Tipo Beneficiario"],
          nomina["Promedio de Notas"],
          nomina["Años Antiguedad"],
          nomina["Rut Empresa"],
          nomina["Nombre Empresa"],
          nomina["Cod Plan"],
          nomina["Año Postulacion"],
          nomina["Rut Beneficiario"],
          nomina["Nombre Beneficiario"],
          nomina.Direccion,
          nomina.Comuna,
          nomina.Sucursal,
          nomina.Cargo,
          nomina["Nro Hijos"],
          nomina["Edad del Beneficiario"],
          nomina["Año Academico"],
          nomina["Tipo Beca"],
          nomina["Razon Social"],
          nomina.Operacion,
          nomina["Nro Contrato"],
          nomina["Encargado Becas Estudio"],
          nomina["Mail Encargado"],
          nomina["Telefono Encargado"]
        ]
      );
      successCount++;
    } catch (error) {
      console.error(`Error migrating nomina ${nomina.Rut}:`, error);
    }
  }
  console.log(`Successfully migrated ${successCount} out of ${nominas.length} nominas`);
}

async function main() {
  try {
    console.log('Starting data migration to database...');

    // Get data from command line arguments
    const users = JSON.parse(process.argv[2] || '[]');
    const nominas = JSON.parse(process.argv[3] || '[]');

    // Migrate users
    if (users.length > 0) {
      await migrateUsers(users);
    }

    // Migrate nominas
    if (nominas.length > 0) {
      await migrateNominas(nominas);
    }

    console.log('\nMigration completed!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

main(); 