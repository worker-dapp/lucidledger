const express = require('express');
const JobPostingController = require('../controllers/jobPostingController');
const { JobPosting } = require('../models');
const { verifyToken, optionalAuth, requireApprovedEmployer } = require('../middleware/authMiddleware');
const { authorize, declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Job postings are employer-owned. The two public reads are public by design — a job
// market nobody can browse is not a job market — and everything else is guarded against
// the posting's owner (#152, GHSA-9vpg).
const owned = () => authorize('ownedByEmployer', { model: JobPosting });

// The handler assigns employer_id from the verified caller; the body cannot name an owner.
router.post('/', verifyToken, requireApprovedEmployer, declarePolicy('ownerFromCaller'),
  JobPostingController.createJobPosting);

router.get('/', verifyToken, declarePolicy('scopedList'),
  JobPostingController.getJobPostingsByEmployer);

// Public, deliberately. The saved/applied flags are computed for the *caller* when there
// is one, not for an employee id named in the query.
router.get('/active', optionalAuth,
  declarePolicy('public', { reason: 'the job market is browsable without an account by design' }),
  JobPostingController.getActiveJobPostings);

router.get('/:id', optionalAuth,
  declarePolicy('public', { reason: 'a job advert is public; a worker reads it before signing up' }),
  JobPostingController.getJobPostingById);

router.put('/:id', verifyToken, requireApprovedEmployer, owned(),
  JobPostingController.updateJobPosting);

router.delete('/:id', verifyToken, requireApprovedEmployer, owned(),
  JobPostingController.deleteJobPosting);

router.post('/:id/close', verifyToken, requireApprovedEmployer, owned(),
  JobPostingController.closeJobPosting);

router.post('/:id/activate', verifyToken, requireApprovedEmployer, owned(),
  JobPostingController.activateJobPosting);

router.patch('/:id/recruiter', verifyToken, requireApprovedEmployer, owned(),
  JobPostingController.assignRecruiter);

module.exports = router;
