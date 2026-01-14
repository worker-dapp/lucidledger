/**
 * Phase 1 API Testing Script
 * Tests Contract Template and Job Posting endpoints
 *
 * Run this after starting the server:
 * node test-phase1-api.js
 */

const API_BASE_URL = 'http://localhost:5001/api';

// Mock employer_id (use an existing employer from your database)
const TEST_EMPLOYER_ID = 1;

async function testAPI(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`\n📡 ${method} ${url}`);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
    console.log('📦 Request Body:', JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success:', response.status);
      console.log('📄 Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('❌ Error:', response.status);
      console.log('📄 Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Request Failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Phase 1 API Tests...\n');
  console.log('=' .repeat(60));

  // Test 1: Create Contract Template
  console.log('\n📋 TEST 1: Create Contract Template');
  console.log('=' .repeat(60));
  const templateData = {
    employer_id: TEST_EMPLOYER_ID,
    name: 'Sewing Operator',
    description: 'Standard contract for garment sewing positions',
    job_type: 'Full-time',
    location_type: 'On-site',
    base_salary: 300,
    currency: 'USD',
    pay_frequency: 'month',
    selected_oracles: 'GPS,Time Clock',
    responsibilities: 'Operate industrial sewing machines, maintain quality standards',
    skills: 'Industrial sewing experience, attention to detail',
    additional_compensation: 'Performance bonuses',
    employee_benefits: 'Health insurance, paid time off'
  };

  const createdTemplate = await testAPI('/contract-templates', 'POST', templateData);
  const templateId = createdTemplate?.data?.id;

  if (!templateId) {
    console.log('\n❌ Cannot continue tests - template creation failed');
    return;
  }

  // Test 2: Get All Templates for Employer
  console.log('\n📋 TEST 2: Get All Contract Templates');
  console.log('=' .repeat(60));
  await testAPI(`/contract-templates?employer_id=${TEST_EMPLOYER_ID}`, 'GET');

  // Test 3: Get Single Template
  console.log('\n📋 TEST 3: Get Single Contract Template');
  console.log('=' .repeat(60));
  await testAPI(`/contract-templates/${templateId}`, 'GET');

  // Test 4: Update Template
  console.log('\n📋 TEST 4: Update Contract Template');
  console.log('=' .repeat(60));
  await testAPI(`/contract-templates/${templateId}`, 'PUT', {
    base_salary: 350,
    description: 'Updated: Standard contract for experienced sewing operators'
  });

  // Test 5: Increment Template Usage
  console.log('\n📋 TEST 5: Increment Template Usage');
  console.log('=' .repeat(60));
  await testAPI(`/contract-templates/${templateId}/use`, 'POST');

  // Test 6: Create Job Posting from Template
  console.log('\n📋 TEST 6: Create Job Posting from Template');
  console.log('=' .repeat(60));
  const jobPostingData = {
    employer_id: TEST_EMPLOYER_ID,
    template_id: templateId,
    positions_available: 50,
    application_deadline: '2026-02-28',
    location: 'Factory Floor A',
    status: 'draft'
  };

  const createdJobPosting = await testAPI('/job-postings', 'POST', jobPostingData);
  const jobPostingId = createdJobPosting?.data?.id;

  if (!jobPostingId) {
    console.log('\n❌ Job posting creation failed');
    return;
  }

  // Test 7: Get All Job Postings for Employer
  console.log('\n📋 TEST 7: Get All Job Postings');
  console.log('=' .repeat(60));
  await testAPI(`/job-postings?employer_id=${TEST_EMPLOYER_ID}`, 'GET');

  // Test 8: Get Single Job Posting
  console.log('\n📋 TEST 8: Get Single Job Posting');
  console.log('=' .repeat(60));
  await testAPI(`/job-postings/${jobPostingId}`, 'GET');

  // Test 9: Update Job Posting
  console.log('\n📋 TEST 9: Update Job Posting');
  console.log('=' .repeat(60));
  await testAPI(`/job-postings/${jobPostingId}`, 'PUT', {
    positions_available: 60,
    location: 'Factory Floor B'
  });

  // Test 10: Activate Job Posting
  console.log('\n📋 TEST 10: Activate Job Posting');
  console.log('=' .repeat(60));
  await testAPI(`/job-postings/${jobPostingId}/activate`, 'POST');

  // Test 11: Close Job Posting
  console.log('\n📋 TEST 11: Close Job Posting');
  console.log('=' .repeat(60));
  await testAPI(`/job-postings/${jobPostingId}/close`, 'POST');

  // Test 12: Delete Job Posting (cleanup)
  console.log('\n📋 TEST 12: Delete Job Posting (cleanup)');
  console.log('=' .repeat(60));
  await testAPI(`/job-postings/${jobPostingId}`, 'DELETE');

  // Test 13: Delete Template (cleanup)
  console.log('\n📋 TEST 13: Delete Contract Template (cleanup)');
  console.log('=' .repeat(60));
  await testAPI(`/contract-templates/${templateId}`, 'DELETE');

  console.log('\n' + '=' .repeat(60));
  console.log('✅ All Phase 1 API Tests Completed!');
  console.log('=' .repeat(60));
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
