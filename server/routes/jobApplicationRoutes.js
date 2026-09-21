const express = require('express');
const jobApplicationController = require('../controllers/jobApplicationController');
const { JobApplication, JobPosting } = require('../models');
const { verifyToken, requireApprovedEmployer } = require('../middleware/authMiddleware');
const { authorize, declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Job applications (#149, GHSA-5g2m). This controller previously had no identity
// authorization at all: the worker was named by the request body, and the owner of a list
// by the path. No route here accepts an identity from the client any more.

// --- worker actions: the caller is the applicant ------------------------------------

router.post('/save', verifyToken, declarePolicy('ownerFromCaller'),
  jobApplicationController.saveJob);

router.post('/unsave', verifyToken,
  declarePolicy('handlerEnforced', {
    reason: 'deletes only within the caller\'s own saved jobs — filter derived by scopeToCaller'
  }),
  jobApplicationController.unsaveJob);

router.post('/apply', verifyToken, declarePolicy('ownerFromCaller'),
  jobApplicationController.applyToJob);

router.get('/saved', verifyToken, declarePolicy('scopedList'),
  jobApplicationController.getSavedJobs);

router.get('/applied', verifyToken, declarePolicy('scopedList'),
  jobApplicationController.getAppliedJobs);

// --- employer and recruiter views ----------------------------------------------------

router.get('/employer', verifyToken, requireApprovedEmployer, declarePolicy('scopedList'),
  jobApplicationController.getApplicationsByEmployer);

router.get('/recruiter', verifyToken, declarePolicy('scopedList'),
  jobApplicationController.getApplicationsByRecruiter);

// Bulk updates take a list of ids, so there is no single record to guard. The handler
// resolves which of them the caller owns and refuses the request unless it owns all.
router.post('/bulk-status', verifyToken, requireApprovedEmployer,
  declarePolicy('handlerEnforced', {
    reason: 'operates on a list of ids; handler scopes to the caller and refuses partial ownership'
  }),
  jobApplicationController.bulkUpdateApplicationStatus);

router.post('/recruiter/bulk-status', verifyToken,
  declarePolicy('handlerEnforced', {
    reason: 'operates on a list of ids; handler scopes to the caller and refuses partial ownership'
  }),
  jobApplicationController.bulkUpdateApplicationStatusAsRecruiter);

// --- the one record route -------------------------------------------------------------
//
// Both parties act on an application: the employer accepts or rejects, the worker signs or
// declines. The employer is named by the posting rather than the application, hence `via`.
router.patch('/:applicationId/status', verifyToken,
  authorize('applicationParty', {
    model: JobApplication,
    paramName: 'applicationId',
    via: { model: JobPosting, key: 'job_posting_id' }
  }),
  jobApplicationController.updateApplicationStatus);

module.exports = router;
