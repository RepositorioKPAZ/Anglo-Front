export interface User {
  ID: number;
  Rut: string;
  Empresa: string;
  Operacion: string;
  Encargado: string;
  Mail: string;
  Telefono: string;
  Empresa_C: string;
}

export interface DatabaseUser extends Omit<User, 'Empresa_C'> {
  password: string; // Renamed from Empresa_C for clarity
}

export interface NominaRow {
  ID?: number;
  Rut: string;
  "Nombre Completo": string;
  Email: string;
  Celular: string;
  "Remuneracion Mes 1": number;
  "Remuneracion Mes 2": number;
  "Remuneracion Mes 3": number;
  "Años Mesa": number;
  "Ingreso Percapita": string;
  "Relacion con el Trabajador": string;
  "Tipo Beneficiario": string;
  "Nro Hijos": number;
  "Nombre Beneficiario": string;
  "Rut Beneficiario": string;
  "Edad del Beneficiario": number;
  "Año Academico": string;
  "Promedio de Notas": number;
  "Años Antiguedad": number;
  "Tipo Beca": string;
  "Razon Social": string;
  "Rut Empresa": string;
  "Nombre Empresa": string;
  "Cod Plan": string;
  "Año Postulacion": number;
  Operacion: string;
  "Nro Contrato": string;
  "Encargado Becas Estudio": string;
  "Mail Encargado": string;
  "Telefono Encargado": string;
  Direccion?: string;
  Comuna?: string;
  Sucursal?: string;
  Cargo?: string;
}

export interface DatabaseNomina {
  nro: number;
  rut: string;
  nombre_completo: string;
  email: string;
  celular: string;
  remuneracion_mes_1: number;
  remuneracion_mes_2: number;
  remuneracion_mes_3: number;
  anos_mesa?: number;
  ingreso_percapita?: string;
  relacion_trabajador: string;
  tipo_beneficiario?: string;
  promedio_notas: number;
  anos_antiguedad?: number;
  empresa_rut: string;
  empresa_nombre?: string;
  cod_plan?: string;
  ano_postulacion?: number;
  rut_beneficiario: string;
  nombre_beneficiario: string;
  direccion?: string;
  comuna?: string;
  sucursal?: string;
  cargo?: string;
  nro_hijos: number;
  edad_beneficiario: number;
  ano_academico: string;
  tipo_beca: string;
  razon_social: string;
  operacion: string;
  nro_contrato: string;
  encargado_becas_estudio: string;
  mail_encargado: string;
  telefono_encargado: string;
} 