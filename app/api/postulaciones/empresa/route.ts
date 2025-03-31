import { NextResponse } from 'next/server';
import { nominasService } from '@/lib/services/nominas-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rutEmpresa = searchParams.get('rutEmpresa');

    if (!rutEmpresa) {
      return NextResponse.json(
        { error: 'El RUT de la empresa es requerido' },
        { status: 400 }
      );
    }

    console.log(`Fetching nominas for empresa with RUT: ${rutEmpresa}`);
    const nominas = await nominasService.getNominasByEmpresa(rutEmpresa);
    console.log(`Found ${nominas.length} records for empresa ${rutEmpresa}`);
    
    // The original code used this mapping that lost information:
    // const result = nominas.map((item) => {
    //   return {
    //     nro: item.ID,
    //     rut: item.Rut,
    //     nombreCompleto: item['Nombre Completo'],
    //     nombreBeneficiario: item['Nombre Beneficiario'],
    //     rutBeneficiario: item['Rut Beneficiario'],
    //     promedioNotas: item['Promedio de Notas'],
    //     tipoBeca: item['Tipo Beca'],
    //   };
    // });
    
    // Return the full dataset instead of the limited fields
    // This will be transformed by the frontend mapToPostulacionEmpresa function
    return NextResponse.json(nominas);
  } catch (error) {
    console.error('Error fetching nominas:', error);
    return NextResponse.json(
      { error: 'Error al cargar los datos de nóminas' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { rut, updatedData } = await request.json();

    if (!rut || !updatedData) {
      return NextResponse.json(
        { error: 'RUT y datos actualizados son requeridos' },
        { status: 400 }
      );
    }

    console.log(`PATCH: Updating nomina with RUT: ${rut} in empresa endpoint`);
    console.log("PATCH data:", JSON.stringify(updatedData, null, 2));

    const updatedNomina = await nominasService.updateNomina(rut, updatedData);

    if (!updatedNomina) {
      return NextResponse.json(
        { error: 'No se encontró la nómina especificada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Datos actualizados correctamente',
      nomina: updatedNomina,
    });
  } catch (error) {
    console.error('Error updating nomina:', error);
    return NextResponse.json(
      { error: 'Error al actualizar los datos de la nómina' },
      { status: 500 }
    );
  }
}
