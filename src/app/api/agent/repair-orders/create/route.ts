import { NextRequest, NextResponse } from 'next/server';
import {
  auditLog,
  getRequestId,
  jsonError,
  normalizePhone,
  requireAgentKey,
  splitName,
  zohoCreateCustomer,
  zohoCreateRepairOrder,
  zohoCreateVehicle,
  zohoLookupCustomerByPhone,
} from '../../_shared';

export const POST = async (req: NextRequest) => {
  const requestId = getRequestId(req);
  const auth = requireAgentKey(req);
  if (!auth.ok) {
    auditLog({ requestId, action: 'repair_orders.create', success: false, status: 401, error: 'unauthorized' });
    return auth.response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    auditLog({ requestId, action: 'repair_orders.create', success: false, status: 400, error: 'invalid_json' });
    return jsonError(400, 'Invalid JSON');
  }

  const customer = body?.customer || {};
  const vehicle = body?.vehicle || {};
  const repairOrder = body?.repairOrder || {};

  const phone = normalizePhone(customer?.phone);
  const email = typeof customer?.email === 'string' ? customer.email.trim() : '';
  const name = typeof customer?.name === 'string' ? customer.name.trim() : '';

  const year = typeof vehicle?.year === 'string' ? vehicle.year.trim() : '';
  const make = typeof vehicle?.make === 'string' ? vehicle.make.trim() : '';
  const model = typeof vehicle?.model === 'string' ? vehicle.model.trim() : '';
  const plate = typeof vehicle?.plate === 'string' ? vehicle.plate.trim() : '';
  const vin = typeof vehicle?.vin === 'string' ? vehicle.vin.trim() : '';

  const serviceType = typeof repairOrder?.serviceType === 'string' ? repairOrder.serviceType.trim() : '';
  const jobDescription = typeof repairOrder?.jobDescription === 'string' ? repairOrder.jobDescription.trim() : '';
  const notes = typeof repairOrder?.notes === 'string' ? repairOrder.notes.trim() : '';
  const status = typeof repairOrder?.status === 'string' ? repairOrder.status.trim() : '';

  const errors: Record<string, string> = {};

  if (!phone) errors['customer.phone'] = 'customer.phone is required';
  if (!year) errors['vehicle.year'] = 'vehicle.year is required';
  if (!make) errors['vehicle.make'] = 'vehicle.make is required';
  if (!model) errors['vehicle.model'] = 'vehicle.model is required';

  if (!serviceType && !jobDescription) {
    errors['repairOrder'] = 'repairOrder.serviceType or repairOrder.jobDescription is required';
  }

  if (Object.keys(errors).length) {
    auditLog({ requestId, action: 'repair_orders.create', success: false, status: 400, error: 'validation_error' });
    return jsonError(400, 'Validation failed', { errors });
  }

  try {
    const existing = await zohoLookupCustomerByPhone(phone);
    const nameParts = splitName(name);

    const createdCustomer = existing
      ? existing
      : await zohoCreateCustomer({
          phone,
          ...(nameParts.first_name ? { first_name: nameParts.first_name } : {}),
          ...(nameParts.last_name ? { last_name: nameParts.last_name } : {}),
          ...(email ? { email } : {}),
        });

    const createdVehicle = await zohoCreateVehicle({
      year,
      make,
      model,
      ...(vin ? { vin } : {}),
      ...(plate ? { license_plate: plate } : {}),
      customer_id: createdCustomer.id,
    });

    const createdRO = await zohoCreateRepairOrder({
      vehicle_id: createdVehicle.id,
      customer_id: createdCustomer.id,
      ...(status ? { status } : {}),
      ...(serviceType ? { service_type: serviceType } : {}),
      ...(jobDescription ? { job_description: jobDescription } : {}),
      ...(notes ? { notes } : {}),
    });

    auditLog({
      requestId,
      action: 'repair_orders.create',
      success: true,
      status: 201,
      customerId: createdCustomer.id,
      repairOrderId: createdRO.id,
    });

    return NextResponse.json(
      {
        customer: createdCustomer,
        vehicle: createdVehicle,
        repairOrder: createdRO,
        requestId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    auditLog({ requestId, action: 'repair_orders.create', success: false, status: 500, error: 'zoho_error' });
    return jsonError(500, 'Failed to create repair order');
  }
};
