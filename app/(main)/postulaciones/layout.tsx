import React from "react";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* <div>
        <h1 className="text-2xl font-bold">Postulaciones</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            Ver Nómina
          </Button>
          <Button size="sm" variant="outline">
            Importar
          </Button>
        </div>
      </div> */}

      {children}
    </>
  );
}

export default layout;
