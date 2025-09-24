const Employee = require('../models/Employee');

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

  // Update employee
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const [updatedRowsCount, updatedEmployee] = await Employee.update(req.body, {
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
