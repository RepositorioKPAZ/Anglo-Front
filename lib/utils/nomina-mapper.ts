import { NominaRow } from "../types/user";

export interface DatabaseNomina {
  ID?: number;
  Rut: string;
  NombreCompleto: string;
  Email: string;
  Celular: string;
  RemuneracionMes1: number;
  RemuneracionMes2: number;
  RemuneracionMes3: number;
  NroHijos: number;
  NombreBeneficiario: string;
  RutBeneficiario: string;
  RelacionTrabajador: string;
  EdadBeneficiario: number;
  AñoAcademico: number | string;
  PromedioNotas: number;
  TipoBeca: string;
  RazonSocial: string;
  RutEmpresa: string;
  Operacion: string;
  NroContrato: string;
  EncargadoBeca: string;
  MailEncargado: string;
  TelefonoEncargado: string;
}

export function mapToDatabase(nomina: NominaRow): DatabaseNomina {
  return {
    ID: nomina.ID,
    Rut: nomina.Rut,
    NombreCompleto: nomina["Nombre Completo"],
    Email: nomina.Email,
    Celular: nomina.Celular,
    RemuneracionMes1: nomina["Remuneracion Mes 1"],
    RemuneracionMes2: nomina["Remuneracion Mes 2"],
    RemuneracionMes3: nomina["Remuneracion Mes 3"],
    NroHijos: nomina["Nro Hijos"],
    NombreBeneficiario: nomina["Nombre Beneficiario"],
    RutBeneficiario: nomina["Rut Beneficiario"],
    RelacionTrabajador: nomina["Relacion con el Trabajador"],
    EdadBeneficiario: nomina["Edad del Beneficiario"],
    AñoAcademico: parseInt(nomina["Año Academico"]) || nomina["Año Academico"],
    PromedioNotas: nomina["Promedio de Notas"],
    TipoBeca: nomina["Tipo Beca"],
    RazonSocial: nomina["Razon Social"],
    RutEmpresa: nomina["Rut Empresa"],
    Operacion: nomina.Operacion,
    NroContrato: nomina["Nro Contrato"],
    EncargadoBeca: nomina["Encargado Becas Estudio"],
    MailEncargado: nomina["Mail Encargado"],
    TelefonoEncargado: nomina["Telefono Encargado"]
  };
}

export function mapFromDatabase(dbNomina: DatabaseNomina): NominaRow {
  return {
    ID: dbNomina.ID,
    Rut: dbNomina.Rut,
    "Nombre Completo": dbNomina.NombreCompleto,
    Email: dbNomina.Email,
    Celular: dbNomina.Celular,
    "Remuneracion Mes 1": dbNomina.RemuneracionMes1,
    "Remuneracion Mes 2": dbNomina.RemuneracionMes2,
    "Remuneracion Mes 3": dbNomina.RemuneracionMes3,
    "Nro Hijos": dbNomina.NroHijos,
    "Nombre Beneficiario": dbNomina.NombreBeneficiario,
    "Rut Beneficiario": dbNomina.RutBeneficiario,
    "Relacion con el Trabajador": dbNomina.RelacionTrabajador,
    "Edad del Beneficiario": dbNomina.EdadBeneficiario,
    "Año Academico": String(dbNomina.AñoAcademico),
    "Promedio de Notas": dbNomina.PromedioNotas,
    "Tipo Beca": dbNomina.TipoBeca,
    "Razon Social": dbNomina.RazonSocial,
    "Rut Empresa": dbNomina.RutEmpresa,
    Operacion: dbNomina.Operacion,
    "Nro Contrato": dbNomina.NroContrato,
    "Encargado Becas Estudio": dbNomina.EncargadoBeca,
    "Mail Encargado": dbNomina.MailEncargado,
    "Telefono Encargado": dbNomina.TelefonoEncargado
  };
} 