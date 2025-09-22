import { FastifyInstance } from 'fastify';
import {
  postCreate,
  getList,
  patchApprove,
  delRemove,
  getByIdCtrl,
  putUpdateCtrl,
  postBulkCreateCtrl,
  getExportCsvCtrl,
  // opcionales:
  getByEmployeeCtrl,
  putUpdateByEmployeeCtrl
} from './payroll.controller.js';

export async function payrollRoutes(app: FastifyInstance) {
  // CRUD principal
  app.post('/api/v1/payrolls', postCreate);
  app.get('/api/v1/payrolls', getList);
  app.get('/api/v1/payrolls/:id', getByIdCtrl);
  app.put('/api/v1/payrolls/:id', putUpdateCtrl);
  app.patch('/api/v1/payrolls/:id/approve', patchApprove);
  app.delete('/api/v1/payrolls/:id', delRemove);

  // extra
  app.post('/api/v1/payrolls/bulk', postBulkCreateCtrl);
  app.get('/api/v1/payrolls/export.csv', getExportCsvCtrl);

  // opcionales por negocio (employeeId + period)
  app.get('/api/v1/payrolls/by-employee/:employeeId', getByEmployeeCtrl);
  app.put('/api/v1/payrolls/by-employee/:employeeId', putUpdateByEmployeeCtrl);
}
