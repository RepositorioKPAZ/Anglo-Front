import { NextResponse } from 'next/server';
import { executeQuery } from '@/app/api/db-connection';
import { User, NominaRow } from "@/lib/types/user";
import { findUserByRutInDb } from "@/lib/services/database-service";

export async function POST(request: Request) {
  try {
    const { users, nominas } = await request.json();

    // Migrate users
    if (users && Array.isArray(users)) {
      for (const user of users) {
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
        }
      }
    }

    // Migrate nominas
    if (nominas && Array.isArray(nominas)) {
      for (const nomina of nominas) {
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
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error migrating data:", error);
    return NextResponse.json(
      { error: "Error al migrar los datos" },
      { status: 500 }
    );
  }
} 