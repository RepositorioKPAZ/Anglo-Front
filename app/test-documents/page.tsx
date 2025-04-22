import React from "react";
import DocumentStatusCell from "@/components/DocumentStatusCell";

export default function TestDocumentsPage() {
  // Test rows with different IDs
  const testRows = [
    { id: "12345678-9", label: "Test Row 1 (with test document)" },
    { id: "98765432-1", label: "Test Row 2 (empty)" },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Document Cell Test Page</h1>

      <div className="space-y-6">
        {testRows.map((row) => (
          <div key={row.id} className="border p-4 rounded">
            <div className="flex items-center mb-2">
              <h2 className="text-lg font-medium mr-4">{row.label}</h2>
              <span className="text-sm text-gray-500">ID: {row.id}</span>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p>Row ID: {row.id}</p>
                <p>RUT Empresa: 76.322.146-6</p>
              </div>

              <DocumentStatusCell
                rowId={row.id}
                rutEmpresa="76.322.146-6"
                className="border p-4 rounded"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
