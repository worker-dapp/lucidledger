# Three-Page Employer Dashboard Architecture
## Implementation Plan for Contract Factory & Batch Deployment System

**Version:** 1.0
**Date:** 2026-01-12
**Target Users:** Medium-to-large manufacturers in developing countries (50-5,000 workers)
**Core Feature:** Template-based contract factory with batch blockchain deployment

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Navigation Structure](#navigation-structure)
3. [Page 1: Contract Factory & Recruitment Hub](#page-1-contract-factory--recruitment-hub)
4. [Page 2: Workforce Dashboard](#page-2-workforce-dashboard)
5. [Page 3: Compliance & History](#page-3-compliance--history)
6. [Revised Landing Dashboard](#revised-landing-dashboard)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [State Management & Data Flow](#state-management--data-flow)
10. [Blockchain Integration Points](#blockchain-integration-points)
11. [Component Library](#component-library)
12. [Implementation Phases](#implementation-phases)
13. [Technical Specifications](#technical-specifications)

---

## Architecture Overview

### Design Principles
1. **Template-First:** Contract templates are the primary creation mechanism
2. **Batch Operations:** Support bulk actions for scale (50-5,000 workers)
3. **Progressive Disclosure:** Hide complexity until needed
4. **Blockchain Transparency:** Clear visibility into deployment status
5. **Compliance-Ready:** Export and audit trails for Western brands
6. **Low-Tech Friendly:** Large targets, clear labels, works on tablets

### Three-Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  EMPLOYER DASHBOARD (Landing/Overview)                      │
│  - Metrics & alerts                                         │
│  - Quick actions                                            │
│  - Navigation hub                                           │
└─────────────────────────────────────────────────────────────┘
           │
           ├──► Page 1: CONTRACT FACTORY & RECRUITMENT HUB
           │    - Template library (create, edit, reuse)
           │    - Job postings (from templates)
           │    - Application review (bulk accept/reject)
           │    - Contract deployment (batch blockchain)
           │
           ├──► Page 2: WORKFORCE DASHBOARD
           │    - Active contracts (post-signature)
           │    - Oracle verification status
           │    - Payment management
           │    - Worker grouping & filtering
           │
           └──► Page 3: COMPLIANCE & HISTORY
                - Completed contracts
                - Disputes & arbitration
                - Audit log
                - Reporting & exports
```

---

## Navigation Structure

### Primary Navigation (Navbar)
```jsx
<EmployerNavbar>
  <Logo />
  <NavItems>
    <NavItem to="/employerDashboard">Dashboard</NavItem>
    <NavItem to="/contract-factory">Contract Factory</NavItem>
    <NavItem to="/workforce">Workforce</NavItem>
    <NavItem to="/compliance">Compliance</NavItem>
  </NavItems>
  <UserMenu />
</EmployerNavbar>
```

### Route Structure
```javascript
// In App.jsx
<Routes>
  {/* Landing Dashboard */}
  <Route path="/employerDashboard" element={<ProtectedRoute><EmployerDashboard /></ProtectedRoute>} />

  {/* Page 1: Contract Factory & Recruitment */}
  <Route path="/contract-factory" element={<ProtectedRoute><ContractFactory /></ProtectedRoute>} />

  {/* Page 2: Workforce Dashboard */}
  <Route path="/workforce" element={<ProtectedRoute><WorkforceDashboard /></ProtectedRoute>} />

  {/* Page 3: Compliance & History */}
  <Route path="/compliance" element={<ProtectedRoute><ComplianceHub /></ProtectedRoute>} />

  {/* Legacy routes - redirect to new structure */}
  <Route path="/job" element={<Navigate to="/contract-factory?action=create" />} />
  <Route path="/review-applications" element={<Navigate to="/contract-factory?tab=applications" />} />
  <Route path="/view-open-contracts" element={<Navigate to="/contract-factory?tab=posted" />} />
</Routes>
```

---

## Page 1: Contract Factory & Recruitment Hub

**Route:** `/contract-factory`
**Purpose:** Template management, job posting, application review, contract deployment

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  CONTRACT FACTORY & RECRUITMENT HUB                         │
│                                                             │
│  [Template Library Section - Always Visible at Top]        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  CONTRACT TEMPLATES                                   │ │
│  │                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐ │ │
│  │  │ Sewing   │  │ Quality  │  │ Packing  │  │  +  │ │ │
│  │  │ Operator │  │ Control  │  │ Staff    │  │ New │ │ │
│  │  │ (450)    │  │ (45)     │  │ (120)    │  │     │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Tabbed Interface for Recruitment Pipeline]               │
│                                                             │
│  ┌───┬───────────────┬──────────────┬──────────────────┐  │
│  │🎯 │ Posted Jobs   │ Applications │ Awaiting Deploy  │  │
│  └───┴───────────────┴──────────────┴──────────────────┘  │
│                                                             │
│  [Tab Content Area - Table or Two-Column Layout]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Template Library Section
**File:** `client/src/EmployerPages/ContractFactory/TemplateLibrary.jsx`

```jsx
<TemplateLibrary>
  <SectionHeader>
    <Title>Contract Templates</Title>
    <Subtitle>Reusable contract templates for common positions</Subtitle>
  </SectionHeader>

  <TemplateGrid>
    {templates.map(template => (
      <TemplateCard
        key={template.id}
        template={template}
        onUse={() => handleUseTemplate(template)}
        onEdit={() => handleEditTemplate(template)}
        onDelete={() => handleDeleteTemplate(template)}
      />
    ))}

    <CreateTemplateCard onClick={() => setShowTemplateForm(true)} />
  </TemplateGrid>

  {showTemplateForm && (
    <TemplateFormModal
      onClose={() => setShowTemplateForm(false)}
      onSave={handleSaveTemplate}
    />
  )}
</TemplateLibrary>
```

**Template Card Design:**
```
┌─────────────────────────────┐
│  📄 Sewing Operator         │
│                             │
│  Base Salary: $300/month    │
│  Location: Factory Floor    │
│  Oracles: GPS + Time Clock  │
│                             │
│  Used 450 times             │
│  Last used: Jan 10, 2026    │
│                             │
│  [Use Template] [Edit] [⋮]  │
└─────────────────────────────┘
```

**Data Structure:**
```javascript
const template = {
  id: 1,
  name: "Sewing Operator",
  description: "Standard contract for garment sewing positions",
  job_type: "Full-time",
  location_type: "On-site",
  base_salary: 300,
  currency: "USD",
  pay_frequency: "month",
  selected_oracles: "GPS,Time Clock",
  responsibilities: "...",
  skills: "...",
  employee_benefits: "...",
  usage_count: 450,
  last_used_at: "2026-01-10T10:30:00Z",
  created_at: "2025-06-01T08:00:00Z",
  employer_id: 123
};
```

---

#### 2. Tab 1: Posted Jobs
**Purpose:** View all active job postings created from templates

**Layout:** Table view for scalability

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  POSTED JOBS (12 active)                               [+ Post New Job]      │
│                                                                              │
│  Search: [________________]   Filters: [All] [Active] [Closed]              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ☐ │ Job Title        │ Positions │ Applications │ Status  │ Actions   │ │
│  ├───┼──────────────────┼───────────┼──────────────┼─────────┼───────────┤ │
│  │ ☐ │ Sewing Operator  │ 50/50     │ 287 pending  │ Active  │ [Review]  │ │
│  │ ☐ │ Quality Control  │ 10/10     │ 45 pending   │ Active  │ [Review]  │ │
│  │ ☐ │ Packing Staff    │ 20/25     │ 12 pending   │ Active  │ [Review]  │ │
│  │ ☐ │ Security Guard   │ 5/5       │ 3 pending    │ Closed  │ [View]    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Bulk Actions: [Edit Selected] [Close Selected] [Export]                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component:**
```jsx
<PostedJobsTab>
  <TabHeader>
    <Title>Posted Jobs ({activeJobs.length} active)</Title>
    <Actions>
      <Button onClick={handlePostNewJob}>+ Post New Job</Button>
    </Actions>
  </TabHeader>

  <Filters>
    <SearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search jobs..."
    />
    <FilterButtons>
      <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
        All
      </FilterButton>
      <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
        Active
      </FilterButton>
      <FilterButton active={filter === 'closed'} onClick={() => setFilter('closed')}>
        Closed
      </FilterButton>
    </FilterButtons>
  </Filters>

  <JobTable
    jobs={filteredJobs}
    onReview={handleReviewApplications}
    onEdit={handleEditJob}
    onClose={handleCloseJob}
  />
</PostedJobsTab>
```

**Post New Job Modal:**
When clicking "+ Post New Job", show modal:
```
┌─────────────────────────────────────────────┐
│  POST NEW JOB                          [X]  │
│                                             │
│  Select Template:                           │
│  ┌─────────────────────────────────────┐   │
│  │ ▼ Sewing Operator                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Number of Positions:                       │
│  ┌─────────────────────────────────────┐   │
│  │ 50                                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Application Deadline:                      │
│  ┌─────────────────────────────────────┐   │
│  │ 2026-02-15                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Customize Contract (optional):             │
│  [ ] Edit salary for this posting           │
│  [ ] Modify responsibilities                │
│  [ ] Change location                        │
│                                             │
│     [Cancel]  [Post Job] ───────────►       │
└─────────────────────────────────────────────┘
```

**Data Structure:**
```javascript
const jobPosting = {
  id: 101,
  template_id: 1,
  title: "Sewing Operator",
  positions_available: 50,
  positions_filled: 0,
  application_deadline: "2026-02-15",
  status: "active", // draft, active, closed
  customizations: {
    salary: null, // null = use template default
    location: null,
    responsibilities: null
  },
  application_count: 287,
  accepted_count: 50,
  created_at: "2026-01-10T09:00:00Z",
  employer_id: 123
};
```

---

#### 3. Tab 2: Application Review
**Purpose:** Review applications, bulk accept/reject, manage hiring pipeline

**Layout:** Two-column (list + detail) similar to EmployeeJobsPage

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  APPLICATION REVIEW (287 pending)                                            │
│                                                                              │
│  ┌─────────────────────────┬──────────────────────────────────────────────┐ │
│  │ LEFT: Application List  │ RIGHT: Applicant Detail                      │ │
│  │                         │                                              │ │
│  │ Filter by Job:          │  JOHN DOE                                    │ │
│  │ [All Jobs ▼]            │  john.doe@email.com                          │ │
│  │                         │  +1234567890                                 │ │
│  │ ☐ Select All (287)      │                                              │ │
│  │                         │  Applied for: Sewing Operator                │ │
│  │ ┌─────────────────────┐ │  Applied on: Jan 8, 2026                     │ │
│  │ │☐ John Doe           │ │                                              │ │
│  │ │  Sewing Operator    │ │  ─────────────────────────────────────────  │ │
│  │ │  Applied: Jan 8     │ │                                              │ │
│  │ └─────────────────────┘ │  PROFILE INFORMATION                         │ │
│  │                         │  First Name: John                            │ │
│  │ ┌─────────────────────┐ │  Last Name: Doe                              │ │
│  │ │☐ Jane Smith         │ │  Email: john.doe@email.com                   │ │
│  │ │  Quality Control    │ │  Phone: +1234567890                          │ │
│  │ │  Applied: Jan 8     │ │  Wallet: 0x742d35Cc6634C0532925a3b844B...   │ │
│  │ └─────────────────────┘ │                                              │ │
│  │                         │  EXPERIENCE                                  │ │
│  │ ┌─────────────────────┐ │  Previous garment factory experience: 3yrs   │ │
│  │ │☐ Ahmed Hassan       │ │  Skills: Industrial sewing, pattern read...  │ │
│  │ │  Sewing Operator    │ │                                              │ │
│  │ │  Applied: Jan 7     │ │                                              │ │
│  │ └─────────────────────┘ │  ─────────────────────────────────────────  │ │
│  │                         │                                              │ │
│  │ ...                     │  [✓ Accept]  [✗ Reject]  [Message]          │ │
│  │                         │                                              │ │
│  └─────────────────────────┴──────────────────────────────────────────────┘ │
│                                                                              │
│  Selected: 15 applications                                                   │
│  [Accept Selected] [Reject Selected] [Export CSV]                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component:**
```jsx
<ApplicationReviewTab>
  <TabHeader>
    <Title>Application Review ({pendingCount} pending)</Title>
  </TabHeader>

  <TwoColumnLayout>
    <LeftColumn width="35%">
      <Filters>
        <Select
          value={selectedJobFilter}
          onChange={setSelectedJobFilter}
          options={jobOptions}
        />
        <Checkbox
          checked={selectAll}
          onChange={handleSelectAll}
          label={`Select All (${applications.length})`}
        />
      </Filters>

      <ApplicationList>
        {applications.map(app => (
          <ApplicationCard
            key={app.id}
            application={app}
            selected={selectedApps.includes(app.id)}
            onSelect={handleSelectApplication}
            onClick={() => setSelectedApplication(app)}
            isActive={selectedApplication?.id === app.id}
          />
        ))}
      </ApplicationList>

      <BulkActions>
        <Text>Selected: {selectedApps.length} applications</Text>
        <ButtonGroup>
          <Button onClick={handleBulkAccept}>Accept Selected</Button>
          <Button onClick={handleBulkReject}>Reject Selected</Button>
          <Button onClick={handleExportCSV}>Export CSV</Button>
        </ButtonGroup>
      </BulkActions>
    </LeftColumn>

    <RightColumn width="65%">
      {selectedApplication ? (
        <ApplicantDetail
          application={selectedApplication}
          onAccept={handleAccept}
          onReject={handleReject}
          onMessage={handleMessage}
        />
      ) : (
        <EmptyState>
          <Icon>👈</Icon>
          <Text>Select an application to view details</Text>
        </EmptyState>
      )}
    </RightColumn>
  </TwoColumnLayout>
</ApplicationReviewTab>
```

**Data Structure:**
```javascript
const application = {
  id: 1001,
  job_posting_id: 101,
  employee_id: 5001,
  employee: {
    id: 5001,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@email.com",
    phone_number: "+1234567890",
    wallet_address: "0x742d35Cc6634C0532925a3b844B....",
    experience: "Previous garment factory experience: 3 years",
    skills: "Industrial sewing, pattern reading, quality control"
  },
  status: "pending", // pending, accepted, rejected
  applied_at: "2026-01-08T14:30:00Z",
  reviewed_at: null,
  offer_sent_at: null,
  offer_accepted_at: null
};
```

**Bulk Action Confirmation:**
```
┌─────────────────────────────────────────────┐
│  CONFIRM BULK ACCEPT                   [X]  │
│                                             │
│  You are about to accept 15 applications    │
│  for the following positions:               │
│                                             │
│  • Sewing Operator: 12 applicants          │
│  • Quality Control: 3 applicants           │
│                                             │
│  ⚠ This will send offer notifications to    │
│  all selected applicants.                   │
│                                             │
│  Continue?                                  │
│                                             │
│     [Cancel]  [Confirm Accept] ─────────►   │
└─────────────────────────────────────────────┘
```

---

#### 4. Tab 3: Awaiting Deployment (NEW - CRITICAL FOR BLOCKCHAIN)
**Purpose:** Batch deploy accepted offers to blockchain

**Layout:** Deployment queue with batch actions

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  AWAITING BLOCKCHAIN DEPLOYMENT                                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  DEPLOYMENT QUEUE: 50 contracts ready                                  │ │
│  │                                                                        │ │
│  │  Job: Sewing Operator (50 workers)                                    │ │
│  │  Estimated Gas: $47.50 (0.015 ETH)                                    │ │
│  │  Estimated Time: 5-10 minutes                                         │ │
│  │                                                                        │ │
│  │  [Review Workers]  [Deploy All Contracts] ─────────────────────────►  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  DEPLOYMENT QUEUE: 10 contracts ready                                 │ │
│  │                                                                        │ │
│  │  Job: Quality Control Inspector (10 workers)                          │ │
│  │  Estimated Gas: $9.50 (0.003 ETH)                                     │ │
│  │  Estimated Time: 2-3 minutes                                          │ │
│  │                                                                        │ │
│  │  [Review Workers]  [Deploy All Contracts] ─────────────────────────►  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ⏳ DEPLOYMENT IN PROGRESS (Job: Packing Staff)                        │ │
│  │                                                                        │ │
│  │  Deploying contracts: 12/20 confirmed                                 │ │
│  │  Transaction: 0x8f3a... [View on Etherscan]                           │ │
│  │                                                                        │ │
│  │  ✅ Ahmed Hassan - 0x742d...                                          │ │
│  │  ✅ Maria Garcia - 0x8f3a...                                          │ │
│  │  ⏳ Chen Wei - Pending...                                             │ │
│  │  ⏳ Fatima Ali - Pending...                                           │ │
│  │                                                                        │ │
│  │  [View All 20 Workers]                                                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Component:**
```jsx
<AwaitingDeploymentTab>
  <TabHeader>
    <Title>Awaiting Blockchain Deployment</Title>
    <Subtitle>
      {pendingDeploymentCount} contracts ready for deployment
    </Subtitle>
  </TabHeader>

  <DeploymentQueueList>
    {deploymentQueues.map(queue => {
      if (queue.status === 'ready') {
        return (
          <DeploymentQueueCard
            key={queue.id}
            queue={queue}
            onReview={handleReviewWorkers}
            onDeploy={handleDeployContracts}
          />
        );
      } else if (queue.status === 'deploying') {
        return (
          <DeploymentProgressCard
            key={queue.id}
            queue={queue}
            onViewAll={handleViewAllWorkers}
          />
        );
      } else if (queue.status === 'failed') {
        return (
          <DeploymentFailedCard
            key={queue.id}
            queue={queue}
            onRetry={handleRetryDeployment}
            onViewError={handleViewError}
          />
        );
      }
    })}
  </DeploymentQueueList>

  {deploymentQueues.length === 0 && (
    <EmptyState>
      <Icon>✅</Icon>
      <Text>All contracts deployed!</Text>
      <Text>No contracts waiting for deployment</Text>
    </EmptyState>
  )}
</AwaitingDeploymentTab>
```

**Deployment Queue Card:**
```jsx
<DeploymentQueueCard queue={queue}>
  <Header>
    <Title>DEPLOYMENT QUEUE: {queue.contract_count} contracts ready</Title>
  </Header>

  <Body>
    <InfoRow>
      <Label>Job:</Label>
      <Value>{queue.job_title} ({queue.contract_count} workers)</Value>
    </InfoRow>
    <InfoRow>
      <Label>Estimated Gas:</Label>
      <Value>${queue.estimated_gas_usd} ({queue.estimated_gas_eth} ETH)</Value>
    </InfoRow>
    <InfoRow>
      <Label>Estimated Time:</Label>
      <Value>{queue.estimated_time}</Value>
    </InfoRow>
  </Body>

  <Actions>
    <Button variant="secondary" onClick={onReview}>
      Review Workers
    </Button>
    <Button variant="primary" onClick={onDeploy}>
      Deploy All Contracts →
    </Button>
  </Actions>
</DeploymentQueueCard>
```

**Deployment Progress Card (Real-time Updates):**
```jsx
<DeploymentProgressCard queue={queue}>
  <Header>
    <StatusIcon>⏳</StatusIcon>
    <Title>DEPLOYMENT IN PROGRESS (Job: {queue.job_title})</Title>
  </Header>

  <ProgressBar
    current={queue.deployed_count}
    total={queue.total_count}
  />

  <Body>
    <InfoRow>
      <Label>Deploying contracts:</Label>
      <Value>{queue.deployed_count}/{queue.total_count} confirmed</Value>
    </InfoRow>
    <InfoRow>
      <Label>Transaction:</Label>
      <Value>
        {queue.transaction_hash}
        <Link href={`https://etherscan.io/tx/${queue.transaction_hash}`}>
          [View on Etherscan]
        </Link>
      </Value>
    </InfoRow>
  </Body>

  <WorkerStatusList collapsed={!expanded}>
    {queue.workers.slice(0, 5).map(worker => (
      <WorkerStatusItem key={worker.id}>
        <StatusIcon>
          {worker.blockchain_status === 'confirmed' ? '✅' : '⏳'}
        </StatusIcon>
        <WorkerName>{worker.name}</WorkerName>
        <ContractAddress>
          {worker.contract_address || 'Pending...'}
        </ContractAddress>
      </WorkerStatusItem>
    ))}
  </WorkerStatusList>

  <Actions>
    <Button onClick={() => setExpanded(!expanded)}>
      View All {queue.total_count} Workers
    </Button>
  </Actions>
</DeploymentProgressCard>
```

**Deploy Confirmation Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│  CONFIRM BLOCKCHAIN DEPLOYMENT                         [X]  │
│                                                             │
│  You are about to deploy 50 contracts to the blockchain    │
│  for the following job:                                     │
│                                                             │
│  Job: Sewing Operator                                       │
│  Workers: 50                                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  COST BREAKDOWN                                       │ │
│  │                                                       │ │
│  │  Gas Price: 25 Gwei                                   │ │
│  │  Total Gas Estimate: 600,000 gas                      │ │
│  │  Total Cost: 0.015 ETH (~$47.50)                      │ │
│  │                                                       │ │
│  │  Deployment Time: 5-10 minutes                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠ WARNING: This transaction is irreversible and will      │
│  create 50 smart contracts on the blockchain.              │
│                                                             │
│  Your wallet will prompt you to confirm the transaction.   │
│                                                             │
│  [ ] I understand the cost and time commitment             │
│                                                             │
│     [Cancel]  [Proceed to Wallet] ──────────────────────►  │
└─────────────────────────────────────────────────────────────┘
```

**Data Structure:**
```javascript
const deploymentQueue = {
  id: 1,
  job_posting_id: 101,
  job_title: "Sewing Operator",
  contract_count: 50,
  status: "ready", // ready, deploying, completed, failed
  estimated_gas_eth: "0.015",
  estimated_gas_usd: "47.50",
  estimated_time: "5-10 minutes",
  transaction_hash: null,
  deployed_count: 0,
  failed_count: 0,
  workers: [
    {
      id: 5001,
      name: "John Doe",
      employee_id: 5001,
      application_id: 1001,
      blockchain_status: "pending_deployment", // pending_deployment, deploying, confirmed, failed
      contract_address: null,
      deployment_error: null
    },
    // ... 49 more workers
  ],
  created_at: "2026-01-10T15:00:00Z",
  deployment_started_at: null,
  deployment_completed_at: null
};
```

**State Management for Real-time Updates:**
```javascript
// Use WebSocket or polling for deployment status
useEffect(() => {
  if (queue.status === 'deploying') {
    const interval = setInterval(async () => {
      const updated = await apiService.getDeploymentStatus(queue.id);
      setQueue(updated);

      if (updated.status === 'completed' || updated.status === 'failed') {
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }
}, [queue.status]);
```

---

## Page 2: Workforce Dashboard

**Route:** `/workforce`
**Purpose:** Monitor active contracts (post-signature), oracle verification, payments

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  WORKFORCE DASHBOARD                                        │
│                                                             │
│  [Metrics Cards - Always Visible at Top]                   │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │ Active      │ │ Verified    │ │ Payment     │         │
│  │ Workers     │ │ Today       │ │ Due         │         │
│  │ 1,247       │ │ 1,180/1,247 │ │ $45,230     │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                             │
│  [Controls: Grouping, Filtering, Search]                   │
│                                                             │
│  [Main Content: Data Table with Active Contracts]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Metrics Overview
```jsx
<WorkforceMetrics>
  <MetricCard
    icon="👥"
    label="Active Workers"
    value={activeWorkerCount}
    change="+12 this week"
    color="blue"
  />
  <MetricCard
    icon="✅"
    label="Verified Today"
    value={`${verifiedToday}/${activeWorkerCount}`}
    percentage={(verifiedToday / activeWorkerCount * 100).toFixed(1)}
    color="green"
  />
  <MetricCard
    icon="💰"
    label="Payment Due"
    value={formatCurrency(totalPaymentDue)}
    subtitle="End of month"
    color="orange"
  />
  <MetricCard
    icon="⚠️"
    label="Issues Flagged"
    value={issueCount}
    color={issueCount > 0 ? "red" : "gray"}
  />
</WorkforceMetrics>
```

#### 2. Controls Panel
```jsx
<ControlsPanel>
  <GroupingSelector
    value={groupBy}
    onChange={setGroupBy}
    options={[
      { value: 'none', label: 'No Grouping' },
      { value: 'job_type', label: 'Group by Job Type' },
      { value: 'department', label: 'Group by Department' },
      { value: 'location', label: 'Group by Location' },
      { value: 'start_date', label: 'Group by Start Date' }
    ]}
  />

  <SearchBar
    value={searchQuery}
    onChange={setSearchQuery}
    placeholder="Search workers, job titles..."
  />

  <FilterDropdowns>
    <FilterSelect
      label="Oracle Status"
      options={['All', 'Verified', 'Pending', 'Failed']}
      value={oracleFilter}
      onChange={setOracleFilter}
    />
    <FilterSelect
      label="Payment Status"
      options={['All', 'Paid', 'Pending', 'Overdue']}
      value={paymentFilter}
      onChange={setPaymentFilter}
    />
  </FilterDropdowns>

  <BulkActions>
    <Button onClick={handleVerifySelected}>Verify Selected</Button>
    <Button onClick={handleProcessPayments}>Process Payments</Button>
    <Button onClick={handleExport}>Export CSV</Button>
  </BulkActions>
</ControlsPanel>
```

#### 3. Active Contracts Table
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ACTIVE CONTRACTS (1,247 workers)                                                    │
│                                                                                      │
│  Grouped by: Job Type                                                                │
│                                                                                      │
│  ▼ Sewing Operator (850 workers)                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │ ☐ │ Worker Name    │ Start Date │ Oracle Status │ Payment   │ Actions        │ │
│  ├───┼────────────────┼────────────┼───────────────┼───────────┼────────────────┤ │
│  │ ☐ │ John Doe       │ Jan 15     │ ✅ GPS ✅ Time│ $300 paid │ [View][Pay]    │ │
│  │ ☐ │ Jane Smith     │ Jan 15     │ ✅ GPS ⏳ Time│ $300 due  │ [View][Pay]    │ │
│  │ ☐ │ Ahmed Hassan   │ Jan 10     │ ❌ GPS ✅ Time│ $300 paid │ [View][Flag]   │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ▼ Quality Control Inspector (45 workers)                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │ ☐ │ Worker Name    │ Start Date │ Oracle Status │ Payment   │ Actions        │ │
│  ├───┼────────────────┼────────────┼───────────────┼───────────┼────────────────┤ │
│  │ ☐ │ Maria Garcia   │ Jan 20     │ ✅ All        │ $450 paid │ [View]         │ │
│  │ ☐ │ Chen Wei       │ Jan 18     │ ✅ All        │ $450 paid │ [View]         │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ▶ Packing Staff (120 workers)                                                      │
│  ▶ Security Guard (232 workers)                                                     │
│                                                                                      │
│  Showing 1-50 of 1,247 workers   [1] [2] [3] ... [25]  ─────────────────────────►  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Component:**
```jsx
<ActiveContractsTable
  contracts={contracts}
  groupBy={groupBy}
  onViewWorker={handleViewWorker}
  onVerifyCompletion={handleVerifyCompletion}
  onProcessPayment={handleProcessPayment}
  onFlagIssue={handleFlagIssue}
/>
```

**Worker Detail Side Panel:**
When clicking "View", show side panel (not full page):
```
┌─────────────────────────────────────────┐
│  JOHN DOE                          [X]  │
│  Contract: 0x742d35Cc...                │
│  [View on Etherscan]                    │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  CONTRACT DETAILS                       │
│  Position: Sewing Operator              │
│  Start Date: Jan 15, 2026               │
│  Salary: $300/month                     │
│  Status: Active                         │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ORACLE VERIFICATION                    │
│  ✅ GPS Oracle                          │
│     Last verified: 2 hours ago          │
│     Location: Factory Floor             │
│                                         │
│  ✅ Time Clock Oracle                   │
│     Today: 8.5 hours logged             │
│     This week: 42 hours                 │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  PAYMENT STATUS                         │
│  Last payment: $300 on Jan 31           │
│  Next payment: $300 due Feb 28          │
│                                         │
│  [Process Payment] [View History]       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  PERFORMANCE                            │
│  Attendance: 98% (23/24 days)           │
│  Verification rate: 100%                │
│  Issues: 0                              │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Message Worker] [Flag Issue]          │
│  [View Full Contract] [Terminate]       │
│                                         │
└─────────────────────────────────────────┘
```

**Data Structure:**
```javascript
const activeContract = {
  id: 2001,
  contract_address: "0x742d35Cc6634C0532925a3b844B....",
  employee_id: 5001,
  employee: {
    id: 5001,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@email.com",
    wallet_address: "0x..."
  },
  job_posting_id: 101,
  job_title: "Sewing Operator",
  job_type: "Full-time",
  department: "Garment Production",
  location: "Factory Floor",
  start_date: "2026-01-15",
  end_date: null,
  salary: 300,
  currency: "USD",
  pay_frequency: "month",
  status: "active", // active, paused, completed, terminated
  oracle_status: {
    gps: {
      enabled: true,
      last_verified: "2026-01-12T14:30:00Z",
      status: "verified" // verified, pending, failed
    },
    time_clock: {
      enabled: true,
      hours_today: 8.5,
      hours_this_week: 42,
      status: "verified"
    }
  },
  payment_status: {
    last_payment_date: "2026-01-31",
    last_payment_amount: 300,
    next_payment_date: "2026-02-28",
    next_payment_amount: 300,
    status: "paid" // paid, pending, overdue
  },
  performance: {
    attendance_rate: 0.98,
    verification_rate: 1.0,
    issue_count: 0
  }
};
```

---

## Page 3: Compliance & History

**Route:** `/compliance`
**Purpose:** Completed contracts, disputes, audit trail, reporting

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  COMPLIANCE & HISTORY                                       │
│                                                             │
│  ┌───┬──────────────┬──────────────┬───────────┬────────┐ │
│  │📦 │ Completed    │ Disputes     │ Audit Log │ Reports│ │
│  └───┴──────────────┴──────────────┴───────────┴────────┘ │
│                                                             │
│  [Tab Content Area]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Tab 1: Completed Contracts
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  COMPLETED CONTRACTS (473 total)                                             │
│                                                                              │
│  Date Range: [Last 30 days ▼]   Export: [CSV] [PDF]                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Worker      │ Job Title   │ Duration  │ Payment │ Verification │ View │ │
│  ├─────────────┼─────────────┼───────────┼─────────┼──────────────┼──────┤ │
│  │ John Doe    │ Sewing Op.  │ 6 months  │ $1,800  │ ✅ Complete  │ [→]  │ │
│  │ Jane Smith  │ Quality     │ 3 months  │ $1,350  │ ✅ Complete  │ [→]  │ │
│  │ Ahmed       │ Packing     │ 12 months │ $3,000  │ ✅ Complete  │ [→]  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Total Paid: $234,500   Average Duration: 8.5 months                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 2. Tab 2: Disputes & Arbitration
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  DISPUTES & ARBITRATION                                                      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ACTIVE DISPUTES (3)                                        Priority   │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  🔴 Payment dispute - Sewing Operator #1247                   High     │ │
│  │     Opened: Jan 10, 2026                                              │ │
│  │     [View Details] [Resolve] [Escalate to Arbitration]                │ │
│  │                                                                        │ │
│  │  🟡 GPS verification failure - Quality Control #892           Medium  │ │
│  │     Opened: Jan 11, 2026                                              │ │
│  │     [View Details] [Resolve] [Escalate to Arbitration]                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  IN ARBITRATION (1)                                                    │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  ⚖️ Wage calculation dispute - Packing Staff #543                      │ │
│  │     Escalated: Jan 5, 2026                                            │ │
│  │     Arbitrator: Third Party Service                                    │ │
│  │     [View Case Details] [View Evidence]                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  RESOLVED (18 in last 90 days)                                         │ │
│  │  [View Archive]                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Dispute Detail Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│  DISPUTE DETAILS                                       [X]  │
│                                                             │
│  Case #1247: Payment dispute                                │
│  Worker: John Doe (Sewing Operator)                         │
│  Opened: Jan 10, 2026 at 2:30 PM                            │
│  Status: Active - Awaiting resolution                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  DISPUTE DESCRIPTION                                        │
│  Worker claims payment of $300 was not received for        │
│  work completed in December 2025.                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  EVIDENCE                                                   │
│  • GPS Oracle: ✅ 23/24 days verified                       │
│  • Time Clock: ✅ 184 hours logged                          │
│  • Payment Record: ❌ No payment found                      │
│  • Smart Contract: 0x742d... [View on Etherscan]           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  TIMELINE                                                   │
│  Jan 10, 14:30 - Worker opened dispute                     │
│  Jan 10, 15:00 - Employer notified                         │
│  Jan 11, 09:00 - Evidence collected                        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ACTIONS                                                    │
│  [✓ Resolve - Process Payment]                             │
│  [↗ Escalate to Arbitration]                               │
│  [✉ Message Worker]                                        │
│  [📎 Add Evidence]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Tab 3: Audit Log
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  AUDIT LOG                                                                   │
│                                                                              │
│  Filter: [All Actions ▼]  Date: [Last 7 days ▼]  Search: [_____________]   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Timestamp        │ User        │ Action                │ Details      │ │
│  ├──────────────────┼─────────────┼───────────────────────┼──────────────┤ │
│  │ Jan 12, 14:30    │ Admin User  │ Contract Deployed     │ Job: Sewing  │ │
│  │ Jan 12, 14:00    │ Admin User  │ Bulk Accept           │ 50 applicants│ │
│  │ Jan 12, 13:30    │ Admin User  │ Job Posted            │ Sewing Op.   │ │
│  │ Jan 12, 10:00    │ Admin User  │ Template Created      │ Quality Ctrl │ │
│  │ Jan 11, 16:00    │ Admin User  │ Payment Processed     │ $45,230      │ │
│  │ Jan 11, 15:30    │ Worker      │ Dispute Opened        │ Case #1247   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  [Export Audit Log]                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 4. Tab 4: Reports
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  REPORTS & EXPORTS                                                           │
│                                                                              │
│  Generate compliance reports for brand audits                               │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  📊 WORKFORCE SUMMARY REPORT                                           │ │
│  │                                                                        │ │
│  │  Date Range: [Jan 1, 2026] to [Jan 31, 2026]                          │ │
│  │                                                                        │ │
│  │  Includes:                                                             │ │
│  │  ☑ Total active workers                                               │ │
│  │  ☑ New hires                                                          │ │
│  │  ☑ Contract completions                                               │ │
│  │  ☑ Average wages paid                                                 │ │
│  │  ☑ Oracle verification rates                                          │ │
│  │                                                                        │ │
│  │  [Generate PDF] [Generate CSV]                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  💰 PAYMENT HISTORY REPORT                                             │ │
│  │                                                                        │ │
│  │  Date Range: [Jan 1, 2026] to [Jan 31, 2026]                          │ │
│  │                                                                        │ │
│  │  Includes:                                                             │ │
│  │  ☑ All payments processed                                             │ │
│  │  ☑ Payment methods (blockchain transactions)                          │ │
│  │  ☑ Worker names and contract addresses                                │ │
│  │  ☑ Payment verification status                                        │ │
│  │                                                                        │ │
│  │  [Generate PDF] [Generate CSV]                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ✅ ORACLE VERIFICATION REPORT                                         │ │
│  │                                                                        │ │
│  │  Date Range: [Jan 1, 2026] to [Jan 31, 2026]                          │ │
│  │                                                                        │ │
│  │  Includes:                                                             │ │
│  │  ☑ GPS check-in records                                               │ │
│  │  ☑ Time clock logs                                                    │ │
│  │  ☑ Verification success rates                                         │ │
│  │  ☑ Failed verifications and reasons                                   │ │
│  │                                                                        │ │
│  │  [Generate PDF] [Generate CSV]                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Revised Landing Dashboard

**Route:** `/employerDashboard`
**Purpose:** Command center with metrics, alerts, quick actions

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome, [First Name]!                                     │
│  Manage all your contracts and workforce in one place       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  NEEDS YOUR ATTENTION                               │   │
│  │                                                     │   │
│  │  🔴 287 Applications to Review                      │   │
│  │     [Review Now →]                                  │   │
│  │                                                     │   │
│  │  🟡 50 Contracts Awaiting Blockchain Deployment     │   │
│  │     [Deploy Now →]                                  │   │
│  │                                                     │   │
│  │  🔴 3 Active Disputes                               │   │
│  │     [View Disputes →]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  QUICK ACTIONS                                      │   │
│  │                                                     │   │
│  │  [📄 Create Contract Template]                      │   │
│  │  [📢 Post New Job]                                  │   │
│  │  [👥 View Active Workforce (1,247 workers)]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TODAY'S ACTIVITY                                   │   │
│  │                                                     │   │
│  │  Workers Verified: 1,180/1,247 (95%)               │   │
│  │  Payments Processed: $12,450                        │   │
│  │  New Applications: 43                               │   │
│  │  Contracts Deployed: 20                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WORKFORCE OVERVIEW                                 │   │
│  │                                                     │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │   │
│  │  │ Active │ │ Posted │ │Deployed│ │Completed│      │   │
│  │  │ 1,247  │ │ Jobs:12│ │ This   │ │ This    │      │   │
│  │  │Workers │ │        │ │ Week:20│ │ Month:43│      │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Component:**
```jsx
<EmployerDashboard>
  <Header>
    <Title>Welcome, {userName}!</Title>
    <Subtitle>Manage all your contracts and workforce in one place</Subtitle>
  </Header>

  <AlertsSection>
    <SectionTitle>NEEDS YOUR ATTENTION</SectionTitle>

    {pendingApplications > 0 && (
      <AlertCard priority="high">
        <Icon>🔴</Icon>
        <Text>{pendingApplications} Applications to Review</Text>
        <Button onClick={() => navigate('/contract-factory?tab=applications')}>
          Review Now →
        </Button>
      </AlertCard>
    )}

    {pendingDeployments > 0 && (
      <AlertCard priority="medium">
        <Icon>🟡</Icon>
        <Text>{pendingDeployments} Contracts Awaiting Blockchain Deployment</Text>
        <Button onClick={() => navigate('/contract-factory?tab=deployment')}>
          Deploy Now →
        </Button>
      </AlertCard>
    )}

    {activeDisputes > 0 && (
      <AlertCard priority="high">
        <Icon>🔴</Icon>
        <Text>{activeDisputes} Active Disputes</Text>
        <Button onClick={() => navigate('/compliance?tab=disputes')}>
          View Disputes →
        </Button>
      </AlertCard>
    )}
  </AlertsSection>

  <QuickActionsSection>
    <SectionTitle>QUICK ACTIONS</SectionTitle>
    <ActionGrid>
      <ActionButton
        icon="📄"
        label="Create Contract Template"
        onClick={() => navigate('/contract-factory?action=create-template')}
      />
      <ActionButton
        icon="📢"
        label="Post New Job"
        onClick={() => navigate('/contract-factory?action=post-job')}
      />
      <ActionButton
        icon="👥"
        label={`View Active Workforce (${activeWorkerCount} workers)`}
        onClick={() => navigate('/workforce')}
      />
    </ActionGrid>
  </QuickActionsSection>

  <TodaysActivitySection>
    <SectionTitle>TODAY'S ACTIVITY</SectionTitle>
    <StatsList>
      <StatItem>
        <Label>Workers Verified:</Label>
        <Value>
          {verifiedToday}/{activeWorkerCount}
          ({(verifiedToday/activeWorkerCount*100).toFixed(0)}%)
        </Value>
      </StatItem>
      <StatItem>
        <Label>Payments Processed:</Label>
        <Value>${paymentsToday.toLocaleString()}</Value>
      </StatItem>
      <StatItem>
        <Label>New Applications:</Label>
        <Value>{newApplicationsToday}</Value>
      </StatItem>
      <StatItem>
        <Label>Contracts Deployed:</Label>
        <Value>{contractsDeployedToday}</Value>
      </StatItem>
    </StatsList>
  </TodaysActivitySection>

  <WorkforceOverviewSection>
    <SectionTitle>WORKFORCE OVERVIEW</SectionTitle>
    <MetricsGrid>
      <MetricCard
        label="Active Workers"
        value={activeWorkerCount}
      />
      <MetricCard
        label="Posted Jobs"
        value={postedJobsCount}
      />
      <MetricCard
        label="Deployed This Week"
        value={deployedThisWeek}
      />
      <MetricCard
        label="Completed This Month"
        value={completedThisMonth}
      />
    </MetricsGrid>
  </WorkforceOverviewSection>
</EmployerDashboard>
```

---

## Database Schema

### New Tables

#### 1. `contract_templates`
```sql
CREATE TABLE contract_templates (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  job_type VARCHAR(50), -- 'Full-time', 'Part-time', 'Contract', etc.
  location_type VARCHAR(50), -- 'On-site', 'Remote', 'Hybrid'
  base_salary DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  pay_frequency VARCHAR(20), -- 'hour', 'day', 'week', 'month'
  selected_oracles TEXT, -- comma-separated: 'GPS,Time Clock,Image'
  responsibilities TEXT,
  skills TEXT,
  employee_benefits TEXT,
  additional_compensation TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_templates_employer ON contract_templates(employer_id);
```

#### 2. `job_postings`
```sql
CREATE TABLE job_postings (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES contract_templates(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  positions_available INTEGER NOT NULL,
  positions_filled INTEGER DEFAULT 0,
  application_deadline DATE,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'closed'

  -- Contract details (can override template)
  job_type VARCHAR(50),
  location_type VARCHAR(50),
  location VARCHAR(255),
  salary DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  pay_frequency VARCHAR(20),
  selected_oracles TEXT,
  responsibilities TEXT,
  skills TEXT,
  employee_benefits TEXT,
  additional_compensation TEXT,
  company_name VARCHAR(255),
  company_description TEXT,

  application_count INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_postings_employer ON job_postings(employer_id);
CREATE INDEX idx_job_postings_template ON job_postings(template_id);
CREATE INDEX idx_job_postings_status ON job_postings(status);
```

#### 3. Update `job_applications` table
```sql
ALTER TABLE job_applications
ADD COLUMN job_posting_id INTEGER REFERENCES job_postings(id) ON DELETE CASCADE,
ADD COLUMN offer_sent_at TIMESTAMP,
ADD COLUMN offer_accepted_at TIMESTAMP,
ADD COLUMN blockchain_deployment_status VARCHAR(30) DEFAULT 'not_deployed';
-- blockchain_deployment_status: 'not_deployed', 'pending_deployment', 'deploying', 'confirmed', 'failed'

CREATE INDEX idx_job_applications_posting ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_blockchain_status ON job_applications(blockchain_deployment_status);
```

#### 4. `deployment_queues`
```sql
CREATE TABLE deployment_queues (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES employer(id) ON DELETE CASCADE,

  job_title VARCHAR(255) NOT NULL,
  contract_count INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'ready', -- 'ready', 'deploying', 'completed', 'failed'

  estimated_gas_eth VARCHAR(20),
  estimated_gas_usd VARCHAR(20),
  estimated_time VARCHAR(50),

  transaction_hash VARCHAR(255),
  deployed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deployment_started_at TIMESTAMP,
  deployment_completed_at TIMESTAMP
);

CREATE INDEX idx_deployment_queues_posting ON deployment_queues(job_posting_id);
CREATE INDEX idx_deployment_queues_status ON deployment_queues(status);
```

#### 5. `blockchain_contracts`
```sql
CREATE TABLE blockchain_contracts (
  id SERIAL PRIMARY KEY,
  job_application_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  deployment_queue_id INTEGER REFERENCES deployment_queues(id) ON DELETE SET NULL,
  employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES employer(id) ON DELETE CASCADE,

  contract_address VARCHAR(255) UNIQUE,
  transaction_hash VARCHAR(255),
  block_number INTEGER,

  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  deployment_error TEXT,

  -- Contract data
  job_title VARCHAR(255),
  start_date DATE,
  end_date DATE,
  salary DECIMAL(10,2),
  currency VARCHAR(10),

  -- Oracle verification
  oracle_config TEXT, -- JSON: {"gps": true, "time_clock": true}

  deployed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blockchain_contracts_application ON blockchain_contracts(job_application_id);
CREATE INDEX idx_blockchain_contracts_employee ON blockchain_contracts(employee_id);
CREATE INDEX idx_blockchain_contracts_employer ON blockchain_contracts(employer_id);
CREATE INDEX idx_blockchain_contracts_address ON blockchain_contracts(contract_address);
CREATE INDEX idx_blockchain_contracts_status ON blockchain_contracts(status);
```

#### 6. `oracle_verifications`
```sql
CREATE TABLE oracle_verifications (
  id SERIAL PRIMARY KEY,
  blockchain_contract_id INTEGER NOT NULL REFERENCES blockchain_contracts(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,

  oracle_type VARCHAR(50) NOT NULL, -- 'GPS', 'Time Clock', 'Image', 'Weight', 'Manual'
  verification_data TEXT, -- JSON data specific to oracle type
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'

  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oracle_verifications_contract ON oracle_verifications(blockchain_contract_id);
CREATE INDEX idx_oracle_verifications_employee ON oracle_verifications(employee_id);
CREATE INDEX idx_oracle_verifications_type ON oracle_verifications(oracle_type);
```

#### 7. `disputes`
```sql
CREATE TABLE disputes (
  id SERIAL PRIMARY KEY,
  blockchain_contract_id INTEGER NOT NULL REFERENCES blockchain_contracts(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES employer(id) ON DELETE CASCADE,

  case_number VARCHAR(50) UNIQUE NOT NULL,
  dispute_type VARCHAR(50) NOT NULL, -- 'Payment', 'Verification', 'Termination', 'Other'
  description TEXT NOT NULL,

  status VARCHAR(20) DEFAULT 'active', -- 'active', 'in_arbitration', 'resolved', 'settled'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'

  evidence_data TEXT, -- JSON: oracle records, messages, etc.

  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  escalated_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disputes_contract ON disputes(blockchain_contract_id);
CREATE INDEX idx_disputes_employee ON disputes(employee_id);
CREATE INDEX idx_disputes_employer ON disputes(employer_id);
CREATE INDEX idx_disputes_status ON disputes(status);
```

#### 8. `audit_log`
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER, -- could be employee_id or employer_id
  user_type VARCHAR(20), -- 'employee' or 'employer'
  action_type VARCHAR(50) NOT NULL,
  action_description TEXT,
  entity_type VARCHAR(50), -- 'contract', 'job_posting', 'application', etc.
  entity_id INTEGER,
  metadata TEXT, -- JSON: additional context
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, user_type);
CREATE INDEX idx_audit_log_action ON audit_log(action_type);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

### Relationships Summary

```
employer
  └── contract_templates (1:many)
  └── job_postings (1:many)
      └── job_applications (1:many)
          └── blockchain_contracts (1:1)
              └── oracle_verifications (1:many)
              └── disputes (1:many)
```

---

## API Endpoints

### Contract Templates

```javascript
// Create template
POST /api/contract-templates
Body: { name, description, job_type, salary, ... }
Auth: verifyToken + employer check

// Get all templates for employer
GET /api/contract-templates
Auth: verifyToken + employer check

// Get single template
GET /api/contract-templates/:id
Auth: verifyToken + employer check

// Update template
PUT /api/contract-templates/:id
Body: { name, salary, ... }
Auth: verifyToken + employer check

// Delete template
DELETE /api/contract-templates/:id
Auth: verifyToken + employer check

// Increment usage count (when used for job posting)
POST /api/contract-templates/:id/use
Auth: verifyToken + employer check
```

### Job Postings

```javascript
// Create job posting from template
POST /api/job-postings
Body: {
  template_id,
  positions_available,
  application_deadline,
  customizations: { salary, location, ... }
}
Auth: verifyToken + employer check

// Get all job postings for employer
GET /api/job-postings?status=active
Auth: verifyToken + employer check

// Get single job posting
GET /api/job-postings/:id
Auth: verifyToken

// Update job posting
PUT /api/job-postings/:id
Body: { positions_available, status, ... }
Auth: verifyToken + employer check

// Close job posting
POST /api/job-postings/:id/close
Auth: verifyToken + employer check

// Delete job posting
DELETE /api/job-postings/:id
Auth: verifyToken + employer check
```

### Job Applications

```javascript
// Apply to job posting (employee)
POST /api/job-applications/apply
Body: { job_posting_id, employee_id }
Auth: verifyToken + employee check

// Get applications for job posting (employer)
GET /api/job-postings/:id/applications?status=pending
Auth: verifyToken + employer check

// Bulk accept applications
POST /api/job-applications/bulk-accept
Body: { application_ids: [1, 2, 3, ...] }
Auth: verifyToken + employer check

// Bulk reject applications
POST /api/job-applications/bulk-reject
Body: { application_ids: [1, 2, 3, ...] }
Auth: verifyToken + employer check

// Accept single application
PUT /api/job-applications/:id/accept
Auth: verifyToken + employer check

// Reject single application
PUT /api/job-applications/:id/reject
Auth: verifyToken + employer check

// Worker accepts offer
PUT /api/job-applications/:id/accept-offer
Auth: verifyToken + employee check
```

### Blockchain Deployment

```javascript
// Create deployment queue (after applications accepted and offers confirmed)
POST /api/deployment-queues
Body: { job_posting_id, application_ids: [1, 2, 3, ...] }
Auth: verifyToken + employer check
Response: {
  queue_id,
  estimated_gas_eth,
  estimated_gas_usd,
  estimated_time
}

// Get deployment queues for employer
GET /api/deployment-queues?status=ready
Auth: verifyToken + employer check

// Initiate batch deployment
POST /api/deployment-queues/:id/deploy
Body: { transaction_hash } (from MetaMask)
Auth: verifyToken + employer check

// Get deployment status (polling endpoint)
GET /api/deployment-queues/:id/status
Auth: verifyToken + employer check
Response: {
  status: 'deploying',
  deployed_count: 23,
  failed_count: 0,
  workers: [
    { id, name, blockchain_status, contract_address },
    ...
  ]
}

// Retry failed deployment
POST /api/deployment-queues/:id/retry
Auth: verifyToken + employer check
```

### Active Contracts (Workforce)

```javascript
// Get active contracts for employer
GET /api/blockchain-contracts?status=active&employer_id=123
Auth: verifyToken + employer check
Query params:
  - group_by: 'job_type' | 'department' | 'location'
  - filter_oracle_status: 'verified' | 'pending' | 'failed'
  - filter_payment_status: 'paid' | 'pending' | 'overdue'

// Get single contract details
GET /api/blockchain-contracts/:id
Auth: verifyToken

// Get oracle verifications for contract
GET /api/blockchain-contracts/:id/verifications
Auth: verifyToken

// Process payment for contract
POST /api/blockchain-contracts/:id/process-payment
Body: { amount, transaction_hash }
Auth: verifyToken + employer check

// Flag issue for contract
POST /api/blockchain-contracts/:id/flag-issue
Body: { issue_type, description }
Auth: verifyToken + employer check

// Complete contract
POST /api/blockchain-contracts/:id/complete
Auth: verifyToken + employer check

// Terminate contract
POST /api/blockchain-contracts/:id/terminate
Body: { reason }
Auth: verifyToken + employer check
```

### Oracle Verifications

```javascript
// Submit GPS verification (worker)
POST /api/oracle-verifications/gps
Body: {
  blockchain_contract_id,
  latitude,
  longitude,
  timestamp
}
Auth: verifyToken + employee check

// Submit time clock verification (worker)
POST /api/oracle-verifications/time-clock
Body: {
  blockchain_contract_id,
  clock_in_time,
  clock_out_time
}
Auth: verifyToken + employee check

// Get verification history
GET /api/oracle-verifications?contract_id=123
Auth: verifyToken
```

### Disputes

```javascript
// Create dispute (worker or employer)
POST /api/disputes
Body: {
  blockchain_contract_id,
  dispute_type,
  description
}
Auth: verifyToken

// Get disputes for employer
GET /api/disputes?employer_id=123&status=active
Auth: verifyToken + employer check

// Get dispute details
GET /api/disputes/:id
Auth: verifyToken

// Resolve dispute
POST /api/disputes/:id/resolve
Body: { resolution_notes }
Auth: verifyToken + employer check

// Escalate to arbitration
POST /api/disputes/:id/escalate
Auth: verifyToken

// Add evidence to dispute
POST /api/disputes/:id/evidence
Body: { evidence_type, evidence_data }
Auth: verifyToken
```

### Compliance & Reporting

```javascript
// Get completed contracts
GET /api/blockchain-contracts/completed?employer_id=123&start_date=2026-01-01&end_date=2026-01-31
Auth: verifyToken + employer check

// Generate workforce summary report
GET /api/reports/workforce-summary?start_date=2026-01-01&end_date=2026-01-31&format=pdf
Auth: verifyToken + employer check
Response: PDF file download

// Generate payment history report
GET /api/reports/payment-history?start_date=2026-01-01&end_date=2026-01-31&format=csv
Auth: verifyToken + employer check
Response: CSV file download

// Generate oracle verification report
GET /api/reports/oracle-verification?start_date=2026-01-01&end_date=2026-01-31&format=pdf
Auth: verifyToken + employer check
Response: PDF file download

// Get audit log
GET /api/audit-log?employer_id=123&action_type=contract_deployed&start_date=2026-01-01
Auth: verifyToken + employer check

// Export audit log
GET /api/audit-log/export?employer_id=123&format=csv
Auth: verifyToken + employer check
Response: CSV file download
```

---

## State Management & Data Flow

### Frontend State Architecture

**Recommendation:** Use React Context + useReducer for complex state, local state for simple components

#### 1. Contract Factory Context
```javascript
// client/src/contexts/ContractFactoryContext.jsx

const ContractFactoryContext = createContext();

const initialState = {
  templates: [],
  jobPostings: [],
  applications: [],
  deploymentQueues: [],
  loading: false,
  error: null
};

const contractFactoryReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map(t =>
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload)
      };
    case 'SET_JOB_POSTINGS':
      return { ...state, jobPostings: action.payload };
    case 'SET_APPLICATIONS':
      return { ...state, applications: action.payload };
    case 'BULK_UPDATE_APPLICATIONS':
      return {
        ...state,
        applications: state.applications.map(app =>
          action.payload.ids.includes(app.id)
            ? { ...app, status: action.payload.status }
            : app
        )
      };
    case 'SET_DEPLOYMENT_QUEUES':
      return { ...state, deploymentQueues: action.payload };
    case 'UPDATE_DEPLOYMENT_QUEUE':
      return {
        ...state,
        deploymentQueues: state.deploymentQueues.map(q =>
          q.id === action.payload.id ? action.payload : q
        )
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const ContractFactoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(contractFactoryReducer, initialState);

  // API methods
  const fetchTemplates = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiService.getContractTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createTemplate = async (templateData) => {
    const response = await apiService.createContractTemplate(templateData);
    dispatch({ type: 'ADD_TEMPLATE', payload: response.data });
    return response.data;
  };

  const bulkAcceptApplications = async (applicationIds) => {
    await apiService.bulkAcceptApplications(applicationIds);
    dispatch({
      type: 'BULK_UPDATE_APPLICATIONS',
      payload: { ids: applicationIds, status: 'accepted' }
    });
  };

  const deployContracts = async (queueId, transactionHash) => {
    await apiService.initiateDeployment(queueId, transactionHash);
    // Start polling for status updates
    pollDeploymentStatus(queueId);
  };

  const pollDeploymentStatus = (queueId) => {
    const interval = setInterval(async () => {
      const updated = await apiService.getDeploymentStatus(queueId);
      dispatch({ type: 'UPDATE_DEPLOYMENT_QUEUE', payload: updated.data });

      if (updated.data.status === 'completed' || updated.data.status === 'failed') {
        clearInterval(interval);
      }
    }, 3000);
  };

  const value = {
    ...state,
    fetchTemplates,
    createTemplate,
    bulkAcceptApplications,
    deployContracts
  };

  return (
    <ContractFactoryContext.Provider value={value}>
      {children}
    </ContractFactoryContext.Provider>
  );
};

export const useContractFactory = () => {
  const context = useContext(ContractFactoryContext);
  if (!context) {
    throw new Error('useContractFactory must be used within ContractFactoryProvider');
  }
  return context;
};
```

#### 2. Workforce Context
```javascript
// client/src/contexts/WorkforceContext.jsx

const WorkforceContext = createContext();

const initialState = {
  activeContracts: [],
  metrics: {
    activeWorkerCount: 0,
    verifiedToday: 0,
    paymentDue: 0,
    issueCount: 0
  },
  groupBy: 'none',
  filters: {
    oracleStatus: 'all',
    paymentStatus: 'all',
    searchQuery: ''
  },
  loading: false,
  error: null
};

// Similar reducer and provider pattern
```

### Data Flow Example: Batch Contract Deployment

```
User clicks "Deploy All Contracts" button
  │
  ├─► Frontend: Show confirmation modal with gas estimates
  │     └─► User confirms
  │           │
  │           ├─► Frontend: Call MetaMask (window.ethereum.request)
  │           │     └─► MetaMask: User approves transaction
  │           │           │
  │           │           ├─► Blockchain: Transaction submitted
  │           │           │     └─► Returns transaction_hash
  │           │           │
  │           │           └─► Frontend: Send transaction_hash to backend
  │           │                 │
  │           │                 └─► POST /api/deployment-queues/:id/deploy
  │           │                       │
  │           │                       ├─► Backend: Update queue status to 'deploying'
  │           │                       ├─► Backend: Update all applications to 'deploying'
  │           │                       └─► Backend: Start monitoring blockchain
  │           │                             │
  │           │                             └─► Listen for TransactionReceipt
  │           │                                   │
  │           │                                   └─► When confirmed:
  │           │                                         - Update queue status to 'completed'
  │           │                                         - Create blockchain_contracts records
  │           │                                         - Update applications to 'confirmed'
  │           │
  │           └─► Frontend: Start polling GET /api/deployment-queues/:id/status
  │                 │
  │                 └─► Every 3 seconds:
  │                       - Fetch updated status
  │                       - Update UI with progress (23/50 confirmed)
  │                       - Show individual worker statuses
  │                       - Stop when status = 'completed' or 'failed'
  │
  └─► User sees real-time progress updates
        └─► Completion: Show success message, redirect to Workforce Dashboard
```

---

## Blockchain Integration Points

### Smart Contract Architecture

#### Option A: Factory Pattern (Recommended)
```solidity
// ContractFactory.sol
contract ContractFactory {
    event ContractDeployed(address indexed contractAddress, address indexed employer, address indexed worker);

    mapping(address => address[]) public employerContracts;
    mapping(address => address) public workerContract;

    function deployMultipleContracts(
        address[] calldata workers,
        bytes[] calldata contractData
    ) external returns (address[] memory) {
        require(workers.length == contractData.length, "Array length mismatch");

        address[] memory deployedAddresses = new address[](workers.length);

        for (uint i = 0; i < workers.length; i++) {
            // Deploy individual WorkContract for each worker
            WorkContract newContract = new WorkContract(
                msg.sender,  // employer
                workers[i],  // worker
                contractData[i]  // job details
            );

            address contractAddress = address(newContract);
            deployedAddresses[i] = contractAddress;

            employerContracts[msg.sender].push(contractAddress);
            workerContract[workers[i]] = contractAddress;

            emit ContractDeployed(contractAddress, msg.sender, workers[i]);
        }

        return deployedAddresses;
    }
}

// WorkContract.sol
contract WorkContract {
    address public employer;
    address public worker;
    uint256 public salary;
    bool public isActive;

    // Oracle integration
    address public gpsOracle;
    address public timeClockOracle;

    constructor(
        address _employer,
        address _worker,
        bytes memory _contractData
    ) {
        employer = _employer;
        worker = _worker;
        // Decode _contractData to set salary, oracles, etc.
        isActive = true;
    }

    function processPayment() external {
        require(msg.sender == employer, "Only employer can process payment");
        require(isActive, "Contract not active");

        // Check oracle verification
        require(verifyOracles(), "Oracle verification failed");

        // Process payment (transfer funds to worker)
        // ...
    }

    function verifyOracles() internal view returns (bool) {
        // Check GPS oracle
        // Check time clock oracle
        // Return true if all required oracles are verified
    }
}
```

### Frontend Integration

#### 1. MetaMask Connection
```javascript
// client/src/utils/blockchain.js

export const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  return accounts[0];
};

export const getGasEstimate = async (contractFactory, workers, contractData) => {
  try {
    const gasEstimate = await contractFactory.estimateGas.deployMultipleContracts(
      workers,
      contractData
    );

    const gasPrice = await contractFactory.provider.getGasPrice();
    const totalCost = gasEstimate.mul(gasPrice);

    return {
      gas: gasEstimate.toString(),
      gasPrice: gasPrice.toString(),
      totalCostWei: totalCost.toString(),
      totalCostEth: ethers.utils.formatEther(totalCost),
      totalCostUsd: await convertEthToUsd(ethers.utils.formatEther(totalCost))
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

export const deployBatchContracts = async (workers, contractData) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const factoryAddress = import.meta.env.VITE_CONTRACT_FACTORY_ADDRESS;
  const contractFactory = new ethers.Contract(
    factoryAddress,
    ContractFactoryABI,
    signer
  );

  // Execute transaction
  const tx = await contractFactory.deployMultipleContracts(workers, contractData);

  return {
    transactionHash: tx.hash,
    wait: () => tx.wait() // Returns promise that resolves when tx is confirmed
  };
};
```

#### 2. Deployment Component
```jsx
// client/src/EmployerPages/ContractFactory/DeploymentQueueCard.jsx

const DeploymentQueueCard = ({ queue, onDeploy }) => {
  const [deploying, setDeploying] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);

  const handlePrepareDeployment = async () => {
    // Fetch worker addresses and prepare contract data
    const workers = queue.workers.map(w => w.wallet_address);
    const contractData = queue.workers.map(w =>
      encodeContractData(w.salary, w.oracles, w.start_date)
    );

    // Get gas estimate
    const estimate = await getGasEstimate(contractFactory, workers, contractData);
    setGasEstimate(estimate);
    setShowConfirmation(true);
  };

  const handleConfirmDeployment = async () => {
    setDeploying(true);
    try {
      // Prepare data
      const workers = queue.workers.map(w => w.wallet_address);
      const contractData = queue.workers.map(w =>
        encodeContractData(w.salary, w.oracles, w.start_date)
      );

      // Deploy to blockchain
      const { transactionHash, wait } = await deployBatchContracts(workers, contractData);

      // Send transaction hash to backend
      await apiService.initiateDeployment(queue.id, transactionHash);

      // Wait for confirmation (optional - backend will also monitor)
      await wait();

      // Notify parent component
      onDeploy(queue.id);

      setShowConfirmation(false);
      alert('Contracts deployed successfully!');
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Deployment failed: ' + error.message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <>
      <DeploymentQueueCard>
        {/* Card UI */}
        <Button onClick={handlePrepareDeployment}>
          Deploy All Contracts →
        </Button>
      </DeploymentQueueCard>

      {showConfirmation && (
        <DeploymentConfirmationModal
          queue={queue}
          gasEstimate={gasEstimate}
          onConfirm={handleConfirmDeployment}
          onCancel={() => setShowConfirmation(false)}
          deploying={deploying}
        />
      )}
    </>
  );
};
```

#### 3. Backend Blockchain Monitoring
```javascript
// server/services/blockchainMonitor.js

const ethers = require('ethers');

class BlockchainMonitor {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    this.contractFactory = new ethers.Contract(
      process.env.CONTRACT_FACTORY_ADDRESS,
      ContractFactoryABI,
      this.provider
    );
  }

  async monitorDeployment(queueId, transactionHash) {
    try {
      // Wait for transaction receipt
      const receipt = await this.provider.waitForTransaction(transactionHash);

      if (receipt.status === 1) {
        // Transaction successful
        // Parse logs to get deployed contract addresses
        const deployedAddresses = this.parseDeploymentLogs(receipt.logs);

        // Update database
        await this.updateDeploymentSuccess(queueId, deployedAddresses);
      } else {
        // Transaction failed
        await this.updateDeploymentFailure(queueId, 'Transaction reverted');
      }
    } catch (error) {
      console.error('Blockchain monitoring error:', error);
      await this.updateDeploymentFailure(queueId, error.message);
    }
  }

  parseDeploymentLogs(logs) {
    const deployedAddresses = [];

    logs.forEach(log => {
      try {
        const parsed = this.contractFactory.interface.parseLog(log);
        if (parsed.name === 'ContractDeployed') {
          deployedAddresses.push({
            contractAddress: parsed.args.contractAddress,
            employer: parsed.args.employer,
            worker: parsed.args.worker
          });
        }
      } catch (e) {
        // Not a ContractDeployed event, skip
      }
    });

    return deployedAddresses;
  }

  async updateDeploymentSuccess(queueId, deployedAddresses) {
    const queue = await DeploymentQueue.findByPk(queueId);

    // Update queue status
    await queue.update({
      status: 'completed',
      deployed_count: deployedAddresses.length,
      deployment_completed_at: new Date()
    });

    // Create blockchain_contracts records
    for (const deployed of deployedAddresses) {
      // Find corresponding application
      const application = await JobApplication.findOne({
        include: [
          {
            model: Employee,
            where: { wallet_address: deployed.worker }
          }
        ],
        where: {
          job_posting_id: queue.job_posting_id,
          status: 'accepted'
        }
      });

      if (application) {
        await BlockchainContract.create({
          job_application_id: application.id,
          deployment_queue_id: queueId,
          employee_id: application.employee_id,
          employer_id: queue.employer_id,
          contract_address: deployed.contractAddress,
          transaction_hash: queue.transaction_hash,
          status: 'confirmed',
          deployed_at: new Date()
        });

        // Update application status
        await application.update({
          blockchain_deployment_status: 'confirmed'
        });
      }
    }
  }

  async updateDeploymentFailure(queueId, errorMessage) {
    await DeploymentQueue.update(
      {
        status: 'failed',
        deployment_error: errorMessage
      },
      { where: { id: queueId } }
    );
  }
}

module.exports = new BlockchainMonitor();
```

---

## Component Library

### Shared Components

Create reusable components in `client/src/components/employer/`

#### 1. MetricCard
```jsx
// client/src/components/employer/MetricCard.jsx
const MetricCard = ({ icon, label, value, subtitle, change, color = 'blue' }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: colors[color] }}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-3xl">{icon}</span>
      {change && (
        <span className="text-sm text-green-600 font-medium">{change}</span>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    <p className="text-gray-600 text-sm">{label}</p>
    {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
  </div>
);
```

#### 2. DataTable
```jsx
// client/src/components/employer/DataTable.jsx
const DataTable = ({
  columns,
  data,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  groupBy = null
}) => {
  // Implementation with grouping, sorting, pagination
  // Virtual scrolling for large datasets
  // Responsive design
};
```

#### 3. StatusBadge
```jsx
// client/src/components/employer/StatusBadge.jsx
const StatusBadge = ({ status, type = 'default' }) => {
  const colorMap = {
    default: {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    },
    blockchain: {
      confirmed: 'bg-green-100 text-green-800',
      deploying: 'bg-blue-100 text-blue-800',
      pending_deployment: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800'
    }
  };

  const iconMap = {
    confirmed: '✅',
    deploying: '⏳',
    pending_deployment: '⏸️',
    failed: '❌',
    active: '✅',
    pending: '⏳',
    completed: '✓'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorMap[type][status]}`}>
      {iconMap[status]} {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};
```

#### 4. OracleStatusIndicator
```jsx
// client/src/components/employer/OracleStatusIndicator.jsx
const OracleStatusIndicator = ({ oracleStatus }) => (
  <div className="flex gap-2">
    {oracleStatus.gps?.enabled && (
      <span className={`text-sm ${oracleStatus.gps.status === 'verified' ? 'text-green-600' : 'text-gray-400'}`}>
        {oracleStatus.gps.status === 'verified' ? '✅' : '⏳'} GPS
      </span>
    )}
    {oracleStatus.time_clock?.enabled && (
      <span className={`text-sm ${oracleStatus.time_clock.status === 'verified' ? 'text-green-600' : 'text-gray-400'}`}>
        {oracleStatus.time_clock.status === 'verified' ? '✅' : '⏳'} Time
      </span>
    )}
  </div>
);
```

#### 5. TwoColumnLayout
```jsx
// client/src/components/employer/TwoColumnLayout.jsx
const TwoColumnLayout = ({
  leftColumn,
  rightColumn,
  leftWidth = '35%',
  rightWidth = '65%'
}) => (
  <div className="flex h-full">
    <div className="overflow-y-auto" style={{ width: leftWidth }}>
      {leftColumn}
    </div>
    <div className="overflow-y-auto border-l border-gray-200" style={{ width: rightWidth }}>
      {rightColumn}
    </div>
  </div>
);
```

---

## Implementation Phases

### Phase 1: Foundation & Contract Factory (Weeks 1-2)

**Goal:** Core template system and job posting functionality

**Tasks:**
1. Database setup
   - Create migrations for new tables
   - Update existing tables (job_applications)
   - Seed test data

2. Backend API
   - Contract templates CRUD endpoints
   - Job postings CRUD endpoints
   - Update job application endpoints

3. Frontend - Contract Factory Page
   - Page shell with navigation
   - Template Library component
   - Template creation form
   - Job posting modal

4. Testing
   - Create template
   - Use template to post job
   - View posted jobs

**Deliverable:** Employers can create templates and post jobs

---

### Phase 2: Application Review & Bulk Operations (Weeks 3-4)

**Goal:** Application management with bulk actions

**Tasks:**
1. Backend API
   - Bulk accept/reject endpoints
   - Application filtering endpoints

2. Frontend - Application Review Tab
   - Two-column layout (list + detail)
   - Checkbox selection
   - Bulk action buttons
   - Application detail panel
   - Filters and search

3. Testing
   - Review applications
   - Bulk accept 50 applicants
   - Verify status updates

**Deliverable:** Employers can efficiently review and accept applications at scale

---

### Phase 3: Blockchain Deployment System (Weeks 5-7)

**Goal:** Batch contract deployment with real-time status tracking

**Tasks:**
1. Smart Contracts
   - Write ContractFactory.sol
   - Write WorkContract.sol
   - Deploy to testnet
   - Test batch deployment

2. Backend API
   - Deployment queue endpoints
   - Blockchain monitoring service
   - Status polling endpoints

3. Frontend - Deployment Tab
   - Deployment queue cards
   - Gas estimation
   - MetaMask integration
   - Deployment progress tracker
   - Real-time status updates

4. Testing
   - Deploy batch of 10 test contracts
   - Monitor deployment progress
   - Verify contract addresses
   - Handle failures

**Deliverable:** Employers can deploy contracts to blockchain in batches with full visibility

---

### Phase 4: Workforce Dashboard (Weeks 8-9)

**Goal:** Monitor active contracts with oracle integration

**Tasks:**
1. Backend API
   - Active contracts endpoints
   - Oracle verification endpoints
   - Grouping and filtering logic

2. Frontend - Workforce Page
   - Metrics overview
   - Controls panel
   - Data table with grouping
   - Worker detail side panel
   - Export functionality

3. Oracle Integration
   - Display oracle status
   - Verification indicators

4. Testing
   - View 1,000+ contracts (performance test)
   - Group by job type
   - Filter by oracle status
   - Export to CSV

**Deliverable:** Employers can monitor active workforce with oracle verification visibility

---

### Phase 5: Compliance & History (Weeks 10-11)

**Goal:** Completed contracts, disputes, audit trail, reporting

**Tasks:**
1. Backend API
   - Disputes CRUD endpoints
   - Audit log tracking
   - Report generation (PDF/CSV)

2. Frontend - Compliance Page
   - Completed contracts tab
   - Disputes tab
   - Audit log tab
   - Reports tab

3. Dispute System
   - Create dispute
   - View evidence (oracle data)
   - Resolve/escalate

4. Reporting
   - Generate workforce summary
   - Generate payment history
   - Generate oracle verification report

5. Testing
   - Create and resolve dispute
   - Generate all report types
   - Verify audit log accuracy

**Deliverable:** Complete compliance system for brand audits

---

### Phase 6: Dashboard & Polish (Week 12)

**Goal:** Unified landing dashboard and final polish

**Tasks:**
1. Revised Dashboard
   - Metrics cards
   - Alerts section
   - Quick actions
   - Today's activity

2. Navigation Updates
   - Update EmployerNavbar
   - Add breadcrumbs
   - Update routing

3. Polish & Optimization
   - Loading states
   - Error handling
   - Responsive design
   - Performance optimization
   - User feedback (toasts, confirmations)

4. Documentation
   - User guide for employers
   - API documentation
   - Deployment guide

**Deliverable:** Production-ready employer dashboard system

---

## Technical Specifications

### Performance Targets

- **Page Load:** < 2 seconds for initial load
- **Data Table:** Handle 5,000+ rows with virtual scrolling
- **Deployment Status:** Update every 3 seconds without lag
- **API Response:** < 500ms for most endpoints
- **Search/Filter:** < 100ms for client-side operations

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Responsive Breakpoints

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Large Desktop: 1440px+

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus indicators

### Security Considerations

1. **Authentication:** All employer endpoints require verifyToken + employer_id check
2. **Authorization:** Employers can only access their own data
3. **Input Validation:** Sanitize all inputs on backend
4. **Rate Limiting:** Apply to blockchain operations
5. **Audit Trail:** Log all critical actions (deployment, payment, disputes)

### Blockchain Considerations

1. **Gas Optimization:** Batch deployment reduces costs by ~70%
2. **Network:** Support multiple networks (testnet, mainnet)
3. **Error Handling:** Graceful handling of failed transactions
4. **Confirmation Wait:** Wait for 2-3 block confirmations
5. **Fallback:** Manual retry for failed deployments

---

## Next Steps

1. **Review & Approval:** Review this plan with stakeholders
2. **Database Migration:** Create and test all new tables
3. **API Development:** Start with Phase 1 backend endpoints
4. **Frontend Setup:** Create page shells and routing
5. **Component Library:** Build shared components first
6. **Iterative Development:** Build and test phase by phase

---

## Appendix: File Structure

```
client/src/
├── EmployerPages/
│   ├── EmployerDashboard.jsx (revised landing page)
│   ├── ContractFactory/
│   │   ├── index.jsx (main page with tabs)
│   │   ├── TemplateLibrary.jsx
│   │   ├── TemplateCard.jsx
│   │   ├── TemplateFormModal.jsx
│   │   ├── PostedJobsTab.jsx
│   │   ├── ApplicationReviewTab.jsx
│   │   ├── AwaitingDeploymentTab.jsx
│   │   ├── DeploymentQueueCard.jsx
│   │   ├── DeploymentProgressCard.jsx
│   │   └── DeploymentConfirmationModal.jsx
│   ├── WorkforceDashboard/
│   │   ├── index.jsx (main page)
│   │   ├── WorkforceMetrics.jsx
│   │   ├── ControlsPanel.jsx
│   │   ├── ActiveContractsTable.jsx
│   │   └── WorkerDetailPanel.jsx
│   └── ComplianceHub/
│       ├── index.jsx (main page with tabs)
│       ├── CompletedContractsTab.jsx
│       ├── DisputesTab.jsx
│       ├── DisputeDetailModal.jsx
│       ├── AuditLogTab.jsx
│       └── ReportsTab.jsx
├── components/
│   ├── employer/
│   │   ├── MetricCard.jsx
│   │   ├── DataTable.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── OracleStatusIndicator.jsx
│   │   ├── TwoColumnLayout.jsx
│   │   └── AlertCard.jsx
│   └── EmployerNavbar.jsx (update with new routes)
├── contexts/
│   ├── ContractFactoryContext.jsx
│   └── WorkforceContext.jsx
├── utils/
│   └── blockchain.js
└── services/
    └── api.js (add new endpoints)

server/
├── controllers/
│   ├── contractTemplateController.js
│   ├── jobPostingController.js
│   ├── jobApplicationController.js (update)
│   ├── deploymentQueueController.js
│   ├── blockchainContractController.js
│   ├── oracleVerificationController.js
│   ├── disputeController.js
│   └── reportController.js
├── models/
│   ├── ContractTemplate.js
│   ├── JobPosting.js
│   ├── JobApplication.js (update)
│   ├── DeploymentQueue.js
│   ├── BlockchainContract.js
│   ├── OracleVerification.js
│   ├── Dispute.js
│   └── AuditLog.js
├── routes/
│   ├── contractTemplates.js
│   ├── jobPostings.js
│   ├── jobApplications.js (update)
│   ├── deploymentQueues.js
│   ├── blockchainContracts.js
│   ├── oracleVerifications.js
│   ├── disputes.js
│   └── reports.js
├── services/
│   └── blockchainMonitor.js
└── migrations/
    ├── 001-create-contract-templates.sql
    ├── 002-create-job-postings.sql
    ├── 003-update-job-applications.sql
    ├── 004-create-deployment-queues.sql
    ├── 005-create-blockchain-contracts.sql
    ├── 006-create-oracle-verifications.sql
    ├── 007-create-disputes.sql
    └── 008-create-audit-log.sql
```

---

**End of Implementation Plan**

---

## IMPLEMENTATION STATUS UPDATE
**Last Updated:** 2026-01-14
**Branch:** ui-refactor

### Phase 1: Contract Factory & Recruitment - ✅ COMPLETE

#### Frontend Status
- ✅ Contract Factory main page with 4 tabs implemented
- ✅ Contract Library tab (create/manage templates)
- ✅ Posted Jobs tab (manage active job postings)
- ✅ Application Review tab (bulk review applications)
- ✅ Awaiting Deployment tab (blockchain deployment queue)
- ✅ 6-step job creation wizard embedded in Contract Library
- ✅ Template saving functionality (checkbox at end of wizard)
- ✅ Employee job search migrated to use `job_postings` table
- ✅ Dashboard consolidated to 4 cards mapping to 3-page architecture

#### Backend Status
- ✅ `contract_templates` table created and functional
- ✅ `job_postings` table created and functional
- ✅ Template CRUD endpoints working
- ✅ Job posting CRUD endpoints working
- ✅ Employee-side API endpoints using `job_postings`
- ✅ Save/Apply job functionality working with `job_posting_id`
- ✅ Old `jobs` table REMOVED (migration 005)
- ✅ Dual-table support REMOVED - only `job_postings` used now

#### Cleanup Completed (2026-01-14)
**Deleted Legacy Files:**
- ❌ `OpenContracts.jsx` - redundant with Contract Factory "Posted Jobs"
- ❌ `EmployerJobPortal.jsx` - old workflow, not needed
- ❌ `ReviewApplications.jsx` - redundant with Contract Factory "Application Review"
- ❌ Old Jobs API routes and controller removed from server

**Database Cleanup:**
- ❌ `jobs` table dropped
- ❌ `job_id` columns removed from `saved_jobs` and `job_applications`
- ✅ `job_posting_id` now NOT NULL in both tables

---

### Phase 2: Active Contracts & Workforce - ⚠️ BACKEND REQUIRED BEFORE UI

#### Current State
**No implementation started.** The dashboard currently links to `/review-completed-contracts`, but this is for **closed** contracts (Phase 3), not **active** contracts.

#### Backend Requirements (MUST BUILD FIRST)

Before starting Phase 2 UI, we need these backend components:

##### 1. New Database Table: `deployed_contracts`
```sql
CREATE TABLE deployed_contracts (
  id BIGSERIAL PRIMARY KEY,
  job_posting_id BIGINT NOT NULL REFERENCES job_postings(id),
  employee_id BIGINT NOT NULL REFERENCES employee(id),
  employer_id BIGINT NOT NULL REFERENCES employer(id),
  
  -- Contract Details
  contract_address VARCHAR(42) NOT NULL UNIQUE, -- Ethereum address
  deployment_tx_hash VARCHAR(66), -- Transaction hash
  deployed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, completed, disputed, terminated
  started_at TIMESTAMP WITH TIME ZONE,
  expected_end_date DATE,
  actual_end_date DATE,
  
  -- Payment Tracking
  payment_amount DECIMAL(15, 2) NOT NULL,
  payment_currency VARCHAR(10) DEFAULT 'USD',
  payment_frequency VARCHAR(50), -- daily, weekly, monthly, per_task
  last_payment_date DATE,
  next_payment_date DATE,
  total_paid DECIMAL(15, 2) DEFAULT 0,
  
  -- Oracle Configuration
  selected_oracles TEXT, -- Comma-separated oracle types
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
  last_verification_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_contract_per_employee_job UNIQUE(job_posting_id, employee_id)
);

CREATE INDEX idx_deployed_contracts_employer ON deployed_contracts(employer_id, status);
CREATE INDEX idx_deployed_contracts_employee ON deployed_contracts(employee_id, status);
CREATE INDEX idx_deployed_contracts_job_posting ON deployed_contracts(job_posting_id);
CREATE INDEX idx_deployed_contracts_status ON deployed_contracts(status);
```

##### 2. New Database Table: `oracle_verifications`
```sql
CREATE TABLE oracle_verifications (
  id BIGSERIAL PRIMARY KEY,
  deployed_contract_id BIGINT NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
  oracle_type VARCHAR(50) NOT NULL, -- gps, image, weight, time_clock, manual
  
  -- Verification Data
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, passed, failed
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by BIGINT REFERENCES employee(id), -- For manual verification
  
  -- GPS Oracle Data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  gps_accuracy_meters DECIMAL(10, 2),
  
  -- Image Oracle Data
  image_url TEXT,
  image_hash VARCHAR(66), -- IPFS or blockchain hash
  
  -- Weight Oracle Data
  weight_recorded DECIMAL(10, 2),
  weight_unit VARCHAR(20),
  
  -- Time Clock Oracle Data
  clock_in_time TIMESTAMP WITH TIME ZONE,
  clock_out_time TIMESTAMP WITH TIME ZONE,
  hours_worked DECIMAL(5, 2),
  
  -- Blockchain Data
  tx_hash VARCHAR(66),
  block_number BIGINT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT oracle_type_check CHECK (oracle_type IN ('gps', 'image', 'weight', 'time_clock', 'manual'))
);

CREATE INDEX idx_oracle_verifications_contract ON oracle_verifications(deployed_contract_id, created_at DESC);
CREATE INDEX idx_oracle_verifications_status ON oracle_verifications(verification_status);
```

##### 3. New Database Table: `payment_transactions`
```sql
CREATE TABLE payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  deployed_contract_id BIGINT NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
  
  -- Transaction Details
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_type VARCHAR(50), -- regular, bonus, penalty, final
  
  -- Blockchain Data
  tx_hash VARCHAR(66) UNIQUE,
  block_number BIGINT,
  from_address VARCHAR(42),
  to_address VARCHAR(42),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT payment_type_check CHECK (payment_type IN ('regular', 'bonus', 'penalty', 'final'))
);

CREATE INDEX idx_payment_transactions_contract ON payment_transactions(deployed_contract_id, created_at DESC);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
```

##### 4. Required API Endpoints

**Deployed Contracts:**
```
GET    /api/deployed-contracts?employer_id=X&status=active
GET    /api/deployed-contracts/:id
POST   /api/deployed-contracts (deploy accepted application to blockchain)
PATCH  /api/deployed-contracts/:id/status
GET    /api/deployed-contracts/employee/:employee_id
```

**Oracle Verifications:**
```
GET    /api/oracle-verifications?contract_id=X
POST   /api/oracle-verifications (record new verification)
GET    /api/oracle-verifications/latest/:contract_id (get latest verification for each oracle type)
```

**Payment Transactions:**
```
GET    /api/payment-transactions?contract_id=X
POST   /api/payment-transactions (trigger payment)
GET    /api/payment-transactions/pending (for batch processing)
```

##### 5. Backend Controllers Needed

Create these controller files:
- `server/controllers/deployedContractController.js`
- `server/controllers/oracleVerificationController.js`
- `server/controllers/paymentTransactionController.js`

##### 6. Blockchain Integration Requirements

**Smart Contract Updates Needed:**
- Currently contracts are hardcoded addresses
- Need contract factory pattern to deploy individual contracts per worker
- Need to integrate with `deployed_contracts` table
- Need webhook/event listener for on-chain events

**Integration Points:**
- Deploy contract when application accepted
- Record oracle verifications on-chain
- Process payments through smart contract
- Listen for blockchain events and update database

---

### Phase 3: Compliance & History - ⚠️ PARTIALLY BUILT

#### Current State
**Existing files that need updates:**

1. **ReviewCompletedContracts.jsx** (`/review-completed-contracts`)
   - Currently filters `jobs` table where `status='closed'`
   - ❌ Broken: still uses old Jobs API
   - ✅ Keep and update to use `deployed_contracts` table

2. **ClosedContracts.jsx** (`/closed-contracts`)
   - Currently filters `jobs` table where `status='completed'`
   - ❌ Broken: still uses old Jobs API
   - ❌ Recommendation: DELETE and merge into ReviewCompletedContracts

3. **Dispute.jsx** (`/dispute`)
   - Currently has mock data, no backend integration
   - ✅ Keep as starting point for disputes functionality

4. **Missing: Payments page**
   - Dashboard links to `/payments` but route doesn't exist
   - Need to build this for Phase 3

#### Backend Requirements

##### 1. Disputes Table
```sql
CREATE TABLE disputes (
  id BIGSERIAL PRIMARY KEY,
  deployed_contract_id BIGINT NOT NULL REFERENCES deployed_contracts(id),
  raised_by_employee_id BIGINT REFERENCES employee(id),
  raised_by_employer_id BIGINT REFERENCES employer(id),
  
  -- Dispute Details
  dispute_type VARCHAR(50) NOT NULL, -- payment, work_quality, contract_breach, other
  status VARCHAR(50) DEFAULT 'open', -- open, under_review, resolved, escalated
  severity VARCHAR(20), -- low, medium, high, critical
  
  -- Description
  title VARCHAR(255) NOT NULL,
  description TEXT,
  evidence_urls TEXT[], -- Array of image/document URLs
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(50), -- employer, employee, arbitrator, system
  
  -- Blockchain Integration
  dispute_tx_hash VARCHAR(66),
  resolution_tx_hash VARCHAR(66),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disputes_contract ON disputes(deployed_contract_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_employer ON disputes(raised_by_employer_id);
```

##### 2. Audit Log Table
```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- deployed_contract, payment, dispute, oracle_verification
  entity_id BIGINT NOT NULL,
  action VARCHAR(50) NOT NULL, -- created, updated, deleted, deployed, verified, paid
  
  -- Actor
  actor_type VARCHAR(50), -- employee, employer, system, oracle
  actor_id BIGINT,
  
  -- Changes
  old_value JSONB,
  new_value JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
```

##### 3. Required API Endpoints

**Disputes:**
```
GET    /api/disputes?employer_id=X&status=open
POST   /api/disputes
PATCH  /api/disputes/:id/resolve
GET    /api/disputes/:id
```

**Audit Log:**
```
GET    /api/audit-log?entity_type=X&entity_id=Y
GET    /api/audit-log/export (CSV/JSON export for compliance)
```

**Reporting:**
```
GET    /api/reports/completed-contracts?employer_id=X&start_date=Y&end_date=Z
GET    /api/reports/payments-summary?employer_id=X&period=monthly
GET    /api/reports/compliance-export (full audit trail)
```

---

## NEXT STEPS

### Immediate Priorities (Before Phase 2 UI)

1. **Create Database Migrations** (3-5 migrations)
   - `006-create-deployed-contracts.sql`
   - `007-create-oracle-verifications.sql`
   - `008-create-payment-transactions.sql`
   - `009-create-disputes.sql`
   - `010-create-audit-log.sql`

2. **Build Backend Controllers** (estimated 3-4 days)
   - deployedContractController.js
   - oracleVerificationController.js
   - paymentTransactionController.js
   - disputeController.js

3. **Add Routes** (1 day)
   - Create route files for each new controller
   - Add to server.js

4. **Smart Contract Integration** (2-3 days)
   - Research contract factory pattern
   - Deploy test contracts
   - Build deployment service
   - Add event listeners

5. **Testing** (1-2 days)
   - Test all new endpoints
   - Test with real blockchain (testnet)
   - Verify oracle integration

### After Backend Complete → Build Phase 2 UI

Once backend is ready, the Phase 2 UI can be built:
- WorkforceDashboard.jsx main page
- Active contracts table/grid
- Worker detail modal
- Oracle verification display
- Payment trigger interface
- Filters and search

---

## TECHNICAL DEBT & NOTES

### Files Still Using Old Jobs API (Need Updates)

These files reference the old `jobs` API and need to be updated or removed:

1. **ReviewCompletedContracts.jsx**
   - Line 59: `apiService.getJobsByEmployer(employerId)`
   - Should use: `apiService.getJobPostings(employerId, 'closed')`

2. **ClosedContracts.jsx**
   - Similar issue, filters for `status='completed'`
   - Recommendation: DELETE this file and merge into ReviewCompletedContracts

3. **JobDetails.jsx** (if still exists)
   - May need updates or deletion

### API Service Cleanup Needed

In `client/src/services/api.js`, these old methods can be removed:
- `getAllJobs()` - replaced by `getActiveJobPostings()`
- `getJobById()` - not used anymore
- `getJobsByEmployer()` - replaced by `getJobPostings()`
- `getJobsWithApplicationsByEmployer()` - not used
- `getJobApplications()` - replaced by Contract Factory tabs
- `getJobsByStatus()` - not used
- `getJobsByCompany()` - not used
- `updateJob()` - replaced by `updateJobPosting()`
- `updateJobStatus()` - replaced by `updateJobPosting()`

### Dashboard Link Fix Needed

In `EmployerDashboard.jsx`:
- "Closed Contracts & History" card links to `/payments` (route doesn't exist)
- Should temporarily link to `/review-completed-contracts`
- Later update to Phase 3 route when built

