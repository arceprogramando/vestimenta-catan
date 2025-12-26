import {
  SENSITIVE_FIELDS,
  AUDIT_METADATA_FIELDS,
  AuditableTable,
  AUDITABLE_TABLES,
} from './audit.types';

/**
 * Verifica si una tabla debe ser auditada
 */
export function isAuditableTable(table: string): table is AuditableTable {
  return AUDITABLE_TABLES.includes(table as AuditableTable);
}

/**
 * Sanitiza un objeto removiendo campos sensibles
 * Optimizado para memoria: no clona si no hay campos sensibles
 */
export function sanitizeData(
  data: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!data) return null;

  const keys = Object.keys(data);
  const hasSensitive = keys.some((key) =>
    SENSITIVE_FIELDS.includes(key as (typeof SENSITIVE_FIELDS)[number]),
  );

  if (!hasSensitive) return data;

  const sanitized: Record<string, unknown> = {};
  for (const key of keys) {
    if (!SENSITIVE_FIELDS.includes(key as (typeof SENSITIVE_FIELDS)[number])) {
      sanitized[key] = data[key];
    } else {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

/**
 * Calcula los campos que cambiaron entre dos estados
 * Ignora campos de metadata de auditoría
 */
export function getChangedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string[] {
  if (!before && !after) return [];
  if (!before) return Object.keys(after!);
  if (!after) return Object.keys(before);

  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    // Ignorar campos de metadata
    if (
      AUDIT_METADATA_FIELDS.includes(
        key as (typeof AUDIT_METADATA_FIELDS)[number],
      )
    ) {
      continue;
    }

    const beforeVal = before[key];
    const afterVal = after[key];

    // Comparación profunda para objetos/arrays
    if (!deepEqual(beforeVal, afterVal)) {
      changed.push(key);
    }
  }

  return changed;
}

/**
 * Comparación profunda optimizada
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  // Manejar BigInt
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    return a === b;
  }

  // Manejar Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Manejar Decimal (Prisma)
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    'toNumber' in a &&
    'toNumber' in b
  ) {
    return (
      (a as { toNumber: () => number }).toNumber() ===
      (b as { toNumber: () => number }).toNumber()
    );
  }

  // Manejar arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  // Manejar objetos
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
}

/**
 * Serializa un valor para JSON, manejando tipos especiales
 */
export function serializeForJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  // Decimal de Prisma
  if (typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(serializeForJson);
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeForJson(v);
    }
    return result;
  }

  return value;
}

/**
 * Prepara datos para guardar en audit_log
 */
export function prepareAuditData(
  data: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!data) return null;
  return serializeForJson(sanitizeData(data)) as Record<string, unknown>;
}

/**
 * Extrae el ID de un registro como string
 */
export function extractRecordId(
  data: Record<string, unknown> | null,
): string | null {
  if (!data) return null;

  // Intentar campos comunes de ID
  const idFields = ['id', 'ID', 'Id'];
  for (const field of idFields) {
    if (data[field] !== undefined) {
      const val = data[field];
      if (typeof val === 'bigint') return val.toString();
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'string') return val;
    }
  }

  return null;
}
