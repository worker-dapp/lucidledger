import JobModel from '../models/Job.js';

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req, res) => {
  try {
    const jobs = await JobModel.getAllJobs();
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching jobs' });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Private
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await JobModel.getJobById(id);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching job' });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private
export const createJob = async (req, res) => {
  try {
    const employer_id = req.user.id;
    const payload = req.body;

    const created = await JobModel.createJob(employer_id, payload);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: created,
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ success: false, error: 'Server error while creating job' });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await JobModel.updateJob(id, updateData);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Job not found or no fields to update' });
    }

    res.json({ success: true, message: 'Job updated successfully', data: updated });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, error: 'Server error while updating job' });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await JobModel.deleteJob(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, message: 'Job deleted successfully', data: deleted });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, error: 'Server error while deleting job' });
  }
}; 