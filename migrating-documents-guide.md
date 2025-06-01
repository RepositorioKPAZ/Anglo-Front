# Comprehensive Document Migration Guide

## Overview

This guide details the process of migrating from a Rut-based document association system to a nomina-based system. It covers the implemented dual-query approach and provides options for handling existing documents.

## Background

Prior to migration:

- Documents were associated with workers via their Rut (Chilean ID)
- Documents appeared in all nominas belonging to the same worker
- No direct connection between documents and specific nomina entries

After migration:

- Documents are associated with specific nomina entries via `id_nomina`
- New documents are properly isolated to their relevant context
- Legacy documents require a migration strategy

## Implemented Changes

### Database Changes

```sql
ALTER TABLE documentosajuntos ADD COLUMN id_nomina VARCHAR(255);
```

### Code Changes

1. **Document Retrieval Functions**

   - Modified to query by both `Ruttrabajador` OR `id_nomina`
   - Ensures backward compatibility with existing documents
   - Prioritizes correct context for new documents

2. **Document Upload**

   - Modified to store both the worker's Rut and the nomina ID
   - Ensures proper association for all new documents

3. **Document Download**
   - Updated to handle potential duplicates in search results
   - Maintains backward compatibility with legacy documents

## Migration Options for Existing Documents

### Option 1: Leave Legacy Documents As-Is

**Description:**
Let existing documents continue to be accessed via Rut, with the understanding that they will appear in all nominas for that worker. As time passes, these documents will become less relevant, and the system will naturally transition to the new model.

**Implementation:**

- No additional work required
- Current dual-query approach already supports this

**Pros:**

- Zero development effort
- No risk of incorrect document assignment
- Simple and pragmatic

**Cons:**

- Users will see legacy documents in all nominas for a worker
- Possible confusion about document context

### Option 2: Admin Document Assignment Panel

**Description:**
Create a dedicated admin interface for manually assigning existing documents to specific nominas.

**Implementation Details:**

1. **Database Query to Identify Legacy Documents:**

```sql
SELECT d.id_doc, d.Ruttrabajador, d.nombre_documento, d.RutEmpresa,
       LENGTH(d.contenido_documento) as fileSize
FROM documentosajuntos d
WHERE d.id_nomina IS NULL
ORDER BY d.Ruttrabajador, d.id_doc DESC;
```

2. **Query to Find Available Nominas for Each Document:**

```sql
SELECT n.ID, n.Rut, n.Nombre_Completo, n.Razon_Social, n.Tipo_Beca
FROM nominabeca n
WHERE n.Rut = ?
ORDER BY n.ID DESC;
```

3. **UI Components:**

   - Document list grouped by worker Rut
   - Dropdown selector for each document showing available nominas
   - PDF preview functionality
   - Batch assignment capabilities
   - Progress tracking

4. **Assignment Workflow:**

   - Admin logs in to migration panel
   - Documents are presented in batches by worker
   - For each document, admin selects the appropriate nomina
   - System updates document with selected `id_nomina`
   - Track completion percentage and remaining documents

5. **Backend API Endpoints:**
   - GET `/api/admin/migration/unassigned-documents?page=1&limit=50`
   - GET `/api/admin/migration/nominas-for-document?rutTrabajador=XX.XXX.XXX-X`
   - PATCH `/api/admin/migration/assign-document`
   - GET `/api/admin/migration/progress`

**Pros:**

- High accuracy in document assignment
- Human judgment for ambiguous cases
- Clear audit trail of decisions
- Can be performed gradually over time

**Cons:**

- Time-consuming manual process
- Requires domain knowledge about documents
- Potential for human error
- Development overhead for a temporary tool

### Option 3: Semi-Automated Assignment Script

**Description:**
Create a script that uses heuristics and potential document content analysis to automatically assign documents to the most likely nomina.

**Implementation Details:**

1. **Text Extraction:**

```javascript
async function extractTextFromPDF(documentId) {
  const doc = await getDocumentById(documentId);
  if (!doc || !doc.contenido_documento) return null;

  // Using a library like pdf.js or pdf-parse
  const pdfData = await pdfParse(doc.contenido_documento);
  return pdfData.text;
}
```

2. **Date-Based Matching:**

```javascript
async function findMatchingNominasByDate(rutTrabajador, documentText) {
  // Extract dates from document text using regex
  const dates = extractDatesFromText(documentText);

  // Get all nominas for this worker
  const nominas = await getNominasForWorker(rutTrabajador);

  // Score each nomina based on date relevance
  return nominas
    .map((nomina) => ({
      nominaId: nomina.ID,
      score: calculateDateRelevanceScore(dates, nomina.fechaCreacion),
    }))
    .sort((a, b) => b.score - a.score);
}
```

3. **Content-Based Matching:**

```javascript
function scoreNominasByContent(nominas, documentText) {
  return nominas
    .map((nomina) => {
      let score = 0;

      // Check for nomina-specific keywords
      if (documentText.includes(nomina.Razon_Social)) score += 5;
      if (documentText.includes(nomina.Tipo_Beca)) score += 3;
      if (documentText.includes(nomina.Año_Academico)) score += 4;

      return { nominaId: nomina.ID, score };
    })
    .sort((a, b) => b.score - a.score);
}
```

4. **Decision Pipeline:**

```javascript
async function assignDocumentToNomina(documentId) {
  const doc = await getDocumentById(documentId);
  if (!doc) return null;

  const text = await extractTextFromPDF(documentId);
  if (!text) {
    // Fallback to filename-based heuristics if text extraction fails
    return assignByFilename(doc);
  }

  const dateMatches = await findMatchingNominasByDate(doc.rowId, text);
  const contentMatches = scoreNominasByContent(
    await getNominasForWorker(doc.rowId),
    text
  );

  // Combine scores
  const combinedScores = combineScores(dateMatches, contentMatches);

  // If highest score exceeds confidence threshold, assign automatically
  if (combinedScores[0] && combinedScores[0].score > CONFIDENCE_THRESHOLD) {
    return updateDocumentNomina(documentId, combinedScores[0].nominaId);
  }

  // Otherwise, flag for manual review
  return flagForManualReview(documentId, combinedScores);
}
```

**Pros:**

- Reduces manual effort
- Potentially high accuracy for certain document types
- Scalable to large document sets

**Cons:**

- Complex implementation
- May require NLP/ML techniques for good results
- Potential for incorrect assignments
- Requires fallback to manual review for low-confidence cases

### Option 4: Hybrid Two-Phase Approach

**Description:**
Combine simple automated rules for clear cases with a streamlined manual process for ambiguous documents.

**Implementation Details:**

**Phase 1: Automatic Assignment**

1. **Simple Heuristic Rules:**

```javascript
async function applySimpleHeuristics(documentId) {
  const doc = await getDocumentById(documentId);
  if (!doc) return false;

  // Get all nominas for this worker
  const nominas = await getNominasForWorker(doc.rowId);

  // Case 1: Worker has only one nomina
  if (nominas.length === 1) {
    await updateDocumentNomina(documentId, nominas[0].ID);
    return true;
  }

  // Case 2: Document upload date is close to a specific nomina creation date
  const uploadDate = new Date(doc.uploadDate);
  for (const nomina of nominas) {
    const nominaDate = new Date(nomina.fechaCreacion);
    const daysDiff = Math.abs(
      (uploadDate - nominaDate) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 30) {
      // Within 30 days
      await updateDocumentNomina(documentId, nomina.ID);
      return true;
    }
  }

  // Case 3: Document name contains unique identifiers from a nomina
  if (doc.fileName) {
    for (const nomina of nominas) {
      // Check for year, operation number, etc. in filename
      if (
        doc.fileName.includes(nomina.Operacion) ||
        doc.fileName.includes(nomina.Año_Academico)
      ) {
        await updateDocumentNomina(documentId, nomina.ID);
        return true;
      }
    }
  }

  return false; // Could not automatically assign
}
```

2. **Batch Processing Script:**

```javascript
async function processLegacyDocuments() {
  let page = 0;
  const pageSize = 100;
  let totalAssigned = 0;
  let totalManual = 0;

  while (true) {
    // Get batch of legacy documents
    const documents = await getLegacyDocuments(page, pageSize);
    if (documents.length === 0) break;

    // Process each document
    for (const doc of documents) {
      const assigned = await applySimpleHeuristics(doc.id_doc);
      if (assigned) {
        totalAssigned++;
      } else {
        totalManual++;
        await flagForManualReview(doc.id_doc);
      }
    }

    page++;
    console.log(
      `Processed ${page * pageSize} documents. Auto-assigned: ${totalAssigned}, Manual review: ${totalManual}`
    );
  }

  return { totalAssigned, totalManual };
}
```

**Phase 2: Simplified Manual Review UI**

1. **Streamlined UI Components:**

   - Simple list of remaining documents
   - Basic information display (filename, size, upload date)
   - Quick-select dropdown for available nominas
   - Batch actions for similar documents

2. **Backend API Endpoints:**
   - GET `/api/admin/migration/manual-review?page=1&limit=50`
   - PATCH `/api/admin/migration/assign-document`
   - POST `/api/admin/migration/batch-assign`

**Pros:**

- Balances efficiency with accuracy
- Reduces manual work to only ambiguous cases
- Provides clear path for all documents
- Can be implemented in stages

**Cons:**

- More complex implementation than Option 1
- Still requires some manual effort
- Some risk of incorrect automated assignments

## Document-to-Nomina Matching Process

To determine which nominas correspond to a pre-migration document, follow this process:

### Step 1: Identify the Document's Worker

```sql
SELECT Ruttrabajador FROM documentosajuntos WHERE id_doc = ?;
```

### Step 2: Find All Nominas for That Worker

```sql
SELECT ID, Nombre_Completo, Razon_Social, Tipo_Beca,
       Año_Academico, fechaCreacion
FROM nominabeca
WHERE Rut = ?;
```

### Step 3: Gather Document Context Information

- **Document Metadata:**

  ```sql
  SELECT nombre_documento, fecha_creacion
  FROM documentosajuntos
  WHERE id_doc = ?;
  ```

- **Document Content (if possible):**
  Extract text from PDF to find dates, names, or other identifiers.

- **Document Filename Analysis:**
  Parse the filename for dates, operation numbers, or other identifiers.

### Step 4: Apply Matching Criteria

1. **Temporal Proximity:**
   Match document to nomina entries based on creation dates.

2. **Content Relevance:**
   Look for company names, operations, academic years, or other identifiers in document content.

3. **Filename Pattern Matching:**
   Check if filename contains specific patterns related to certain nominas.

4. **User Knowledge:**
   In ambiguous cases, rely on admin/user knowledge about the document's purpose.

### Step 5: Assignment Decision

- If a single clear match is found, assign automatically
- If multiple potential matches exist, present options to admin
- If no clear match, default to most recent nomina or flag for manual review

### Implementation Example

```javascript
async function findMatchingNominas(documentId) {
  // Get document details
  const doc = await getDocumentById(documentId);
  if (!doc) return [];

  // Get all nominas for this worker
  const nominas = await db.query(
    "SELECT ID, Nombre_Completo, Razon_Social, Tipo_Beca, Año_Academico, fechaCreacion " +
      "FROM nominabeca WHERE Rut = ?",
    [doc.rowId]
  );

  // Calculate match scores for each nomina
  const scores = nominas.map((nomina) => {
    let score = 0;

    // 1. Date proximity
    const docDate = new Date(doc.uploadDate);
    const nominaDate = new Date(nomina.fechaCreacion);
    const daysDiff = Math.abs((docDate - nominaDate) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 100 - daysDiff); // Higher score for closer dates

    // 2. Filename matching
    if (doc.fileName.includes(nomina.Razon_Social)) score += 50;
    if (doc.fileName.includes(nomina.Año_Academico)) score += 30;
    if (doc.fileName.includes(nomina.Tipo_Beca)) score += 20;

    // 3. Content analysis (if implemented)
    // score += analyzeDocumentContent(doc, nomina);

    return {
      nominaId: nomina.ID,
      nominaName: `${nomina.Razon_Social} - ${nomina.Tipo_Beca} (${nomina.Año_Academico})`,
      score,
    };
  });

  // Sort by score (highest first)
  return scores.sort((a, b) => b.score - a.score);
}
```

## Recommended Approach

**For Most Cases: Option 1 (Leave Legacy Documents As-Is)**

This approach requires:

- No additional development work
- Zero risk of incorrect assignments
- Natural transition as new documents are properly associated

**For High-Value Document Sets: Option 4 (Hybrid Approach)**

This approach provides:

- Automated handling of clear-cut cases
- Manual review only for ambiguous documents
- Balance between effort and accuracy

## Implementation Roadmap

1. **Phase 0 (Completed)**

   - Add `id_nomina` column to database
   - Update code for dual-query approach
   - Deploy changes to production

2. **Phase 1 (Optional)**

   - Implement simple heuristics script for clear cases
   - Run script on production database during off-hours
   - Generate report of auto-assigned and remaining documents

3. **Phase 2 (Optional)**
   - Develop simplified admin review interface
   - Prioritize documents by business importance
   - Process remaining documents in batches

## Conclusion

The dual-query approach provides a robust foundation for the transition from Rut-based to nomina-based document management. For most cases, allowing legacy documents to remain as-is is the most pragmatic approach, with minimal development effort and risk.

If document organization is business-critical, the hybrid approach offers the best balance of efficiency and accuracy, with automated handling of clear cases and a streamlined process for the rest.
