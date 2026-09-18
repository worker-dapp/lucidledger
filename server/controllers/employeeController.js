const { Employee } = require('../models');
const { resolveEmployee } = require('../services/identityService');

const pickAllowedFields = (payload, allowedFields) => {
  return Object.keys(payload).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

// Every field a worker may set on their own profile. Excludes id/created_at/updated_at.
const ALLOWED_UPDATE_FIELDS = [
  'first_name', 'last_name', 'phone_number', 'email', 'wallet_address',
  'street_address', 'street_address2', 'country', 'state', 'zip_code', 'city',
  'country_code', 'skills', 'work_experience', 'primary_language', 'availability',
  'bio', 'willing_to_travel'
];

class EmployeeController {
  // Create a new employee
  static async createEmployee(req, res) {
    try {
      // Bind the new record to the verified identity.
      // Allowlist the body. Spreading req.body directly let a client set ANY column:
      // id and any future privileged column were settable here via the body spread.
      // auth_subject is applied after the allowlist and is not in it, so it can only ever
      // come from the verified token.
      const employee = await Employee.create({
        ...pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS),
        auth_subject: req.authSubject
      });
      res.status(201).json({
        success: true,
        data: employee,
        message: 'Employee created successfully'
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating employee',
        error: error.message
      });
    }
  }

  // Update employee
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;

      // Authorize off the verified identity.
      const callingEmployee = await resolveEmployee(req);
      if (!callingEmployee || String(callingEmployee.id) !== String(id)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this employee profile'
        });
      }

      const updates = pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS);

      const [updatedRowsCount, updatedEmployee] = await Employee.update(updates, {
        where: { id },
        returning: true
      });
      
      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedEmployee[0],
        message: 'Employee updated successfully'
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating employee',
        error: error.message
      });
    }
  }

}

module.exports = EmployeeController;
