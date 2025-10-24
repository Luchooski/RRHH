import { Employee, type EmployeeDoc } from './employee.model.js';
import { Parser } from 'json2csv';
import { Readable } from 'stream';

export interface EmployeeExportOptions {
  format: 'csv' | 'json';
  fields?: string[]; // Campos específicos a exportar
  includeAll?: boolean; // Incluir todos los campos
}

export interface EmployeeImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  created: string[]; // IDs de empleados creados
}

/**
 * Exportar empleados a CSV o JSON
 */
export async function exportEmployees(
  tenantId: string,
  options: EmployeeExportOptions = { format: 'csv' }
): Promise<string | object[]> {
  const { format, fields, includeAll } = options;

  // Buscar todos los empleados del tenant
  const employees = await Employee.find({ tenantId }).lean();

  if (employees.length === 0) {
    throw new Error('No hay empleados para exportar');
  }

  // Campos por defecto a exportar
  const defaultFields = [
    '_id',
    'firstName',
    'lastName',
    'email',
    'phone',
    'position',
    'department',
    'hireDate',
    'salary',
    'status',
    'dni',
    'cuil',
    'dateOfBirth',
    'gender',
    'maritalStatus',
    'nationality',
  ];

  const fieldsToExport = fields || (includeAll ? Object.keys(employees[0]) : defaultFields);

  if (format === 'json') {
    // Retornar JSON directamente
    return employees.map((emp: EmployeeDoc) => {
      const filtered: any = {};
      fieldsToExport.forEach((field) => {
        if (field in emp) {
          filtered[field] = (emp as any)[field];
        }
      });
      return filtered;
    });
  }

  // Formato CSV
  try {
    const parser = new Parser({
      fields: fieldsToExport.map((f) => ({
        label: f,
        value: f,
      })),
    });

    const csv = parser.parse(employees);
    return csv;
  } catch (error: any) {
    throw new Error(`Error al generar CSV: ${error.message}`);
  }
}

/**
 * Importar empleados desde CSV o JSON
 */
export async function importEmployees(
  tenantId: string,
  data: any[],
  options: { updateExisting?: boolean; dryRun?: boolean } = {}
): Promise<EmployeeImportResult> {
  const { updateExisting = false, dryRun = false } = options;

  const result: EmployeeImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    created: [],
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1;

    try {
      // Validar campos requeridos
      if (!row.email) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: 'Email es requerido',
          data: row,
        });
        continue;
      }

      if (!row.firstName || !row.lastName) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: 'Nombre y apellido son requeridos',
          data: row,
        });
        continue;
      }

      // Verificar si el empleado ya existe (por email)
      const existing = await Employee.findOne({
        tenantId,
        email: row.email.toLowerCase().trim(),
      });

      if (existing && !updateExisting) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: `El empleado con email ${row.email} ya existe`,
          data: row,
        });
        continue;
      }

      if (dryRun) {
        // Modo de prueba, no crear/actualizar
        result.success++;
        continue;
      }

      if (existing && updateExisting) {
        // Actualizar empleado existente
        Object.assign(existing, {
          ...row,
          tenantId, // Asegurar que el tenantId no cambie
          email: row.email.toLowerCase().trim(),
        });
        await existing.save();
        result.success++;
        result.created.push(existing._id.toString());
      } else {
        // Crear nuevo empleado
        const employee = await Employee.create({
          ...row,
          tenantId,
          email: row.email.toLowerCase().trim(),
          status: row.status || 'active',
        });
        result.success++;
        result.created.push(employee._id.toString());
      }
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        row: rowNumber,
        error: error.message || 'Error desconocido',
        data: row,
      });
    }
  }

  return result;
}

/**
 * Parsear CSV a JSON
 */
export function parseCSV(csvString: string): any[] {
  const lines = csvString.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error('El archivo CSV está vacío');
  }

  // Primera línea es el encabezado
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"(.*)"$/, '$1'));

  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"(.*)"$/, '$1'));

    if (values.length !== headers.length) {
      continue; // Saltar líneas malformadas
    }

    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });

    data.push(obj);
  }

  return data;
}

/**
 * Validar formato de archivo de importación
 */
export function validateImportData(data: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Los datos deben ser un array');
    return { valid: false, errors };
  }

  if (data.length === 0) {
    errors.push('El archivo no contiene datos');
    return { valid: false, errors };
  }

  // Validar que cada elemento tenga al menos email, firstName, lastName
  const requiredFields = ['email', 'firstName', 'lastName'];

  data.forEach((item, index) => {
    requiredFields.forEach((field) => {
      if (!item[field]) {
        errors.push(`Fila ${index + 1}: Falta el campo requerido "${field}"`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
