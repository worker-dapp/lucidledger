const Employer = require('../models/Employer');

class EmployerController {
  // Create a new employer
  static async createEmployer(req, res) {
    try {
      const employer = await Employer.create(req.body);
      res.status(201).json({
        success: true,
        data: employer,
        message: 'Employer created successfully'
      });
    } catch (error) {
      console.error('Error creating employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating employer',
        error: error.message
      });
    }
  }

  // Get all employers
  static async getAllEmployers(req, res) {
    try {
      const employers = await Employer.findAll({
        order: [['created_at', 'DESC']]
      });
      res.status(200).json({
        success: true,
        data: employers,
        count: employers.length
      });
    } catch (error) {
      console.error('Error fetching employers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employers',
        error: error.message
      });
    }
  }

  // Get employer by ID
  static async getEmployerById(req, res) {
    try {
      const { id } = req.params;
      const employer = await Employer.findByPk(id);
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employer
      });
    } catch (error) {
      console.error('Error fetching employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer',
        error: error.message
      });
    }
  }

  // Get employer by email
  static async getEmployerByEmail(req, res) {
    try {
      const { email } = req.params;
      const employer = await Employer.findOne({
        where: { email }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employer
      });
    } catch (error) {
      console.error('Error fetching employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer',
        error: error.message
      });
    }
  }

  // Get employer by wallet address
  static async getEmployerByWallet(req, res) {
    try {
      const { wallet_address } = req.params;
      const employer = await Employer.findOne({
        where: { wallet_address }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employer
      });
    } catch (error) {
      console.error('Error fetching employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer',
        error: error.message
      });
    }
  }

  // Update employer
  static async updateEmployer(req, res) {
    try {
      const { id } = req.params;
      const [updatedRowsCount, updatedEmployer] = await Employer.update(req.body, {
        where: { id },
        returning: true
      });
      
      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedEmployer[0],
        message: 'Employer updated successfully'
      });
    } catch (error) {
      console.error('Error updating employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating employer',
        error: error.message
      });
    }
  }

}

module.exports = EmployerController;
