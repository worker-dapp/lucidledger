const { Employee } = require('../models');
const { Op } = require('sequelize');

// Get employee by wallet address (case-insensitive — addresses may differ in checksum casing)
const getEmployeeForUser = async (walletAddress) => {
  if (!walletAddress) return null;
  return Employee.findOne({ where: { wallet_address: { [Op.iLike]: walletAddress } } });
};

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
      const employee = await Employee.create(req.body);
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

  // Get all employees
  static async getAllEmployees(req, res) {
    try {
      const employees = await Employee.findAll({
        order: [['created_at', 'DESC']]
      });
      res.status(200).json({
        success: true,
        data: employees,
        count: employees.length
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employees',
        error: error.message
      });
    }
  }

  // Get employee by ID
  static async getEmployeeById(req, res) {
    try {
      const { id } = req.params;
      const employee = await Employee.findByPk(id);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employee',
        error: error.message
      });
    }
  }

  // Get employee by email
  static async getEmployeeByEmail(req, res) {
    try {
      const { email } = req.params;
      const employee = await Employee.findOne({
        where: { email }
      });
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employee',
        error: error.message
      });
    }
  }

  // Get employee by wallet address
  static async getEmployeeByWallet(req, res) {
    try {
      const { wallet_address } = req.params;
      const employee = await Employee.findOne({
        where: { wallet_address }
      });
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employee',
        error: error.message
      });
    }
  }

  // Get employee by phone number
  static async getEmployeeByPhone(req, res) {
    try {
      const { phone_number } = req.params;
      const employee = await Employee.findOne({
        where: { phone_number }
      });
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employee',
        error: error.message
      });
    }
  }

  // Update employee
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;

      const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address;
      const callingEmployee = await getEmployeeForUser(walletAddress);
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
