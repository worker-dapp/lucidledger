export const sampleJobs = [
  {
    id: 'sample-1',
    title: 'Senior Software Engineer',
    company_name: 'Tech Innovations Inc.',
    location: 'San Francisco, CA',
    salary: 120000,
    currency: '$',
    pay_frequency: 'year',
    status: 'active',
    job_type: 'Full-time',
    location_type: 'Hybrid',
    description: 'We are seeking a talented Senior Software Engineer to join our dynamic team. You will be responsible for developing cutting-edge web applications and contributing to our innovative projects.',
    responsibilities: '• Design and develop scalable web applications\n• Collaborate with cross-functional teams\n• Mentor junior developers\n• Participate in code reviews and technical discussions\n• Contribute to architectural decisions',
    skills: 'JavaScript, React, Node.js, Python, AWS, Docker, Git, Agile methodologies',
    additional_compensation: 'Annual bonus up to 15%, Stock options',
    employee_benefits: 'Health insurance, Dental & Vision, 401(k) matching, Unlimited PTO, Remote work flexibility',
    company_description: 'Tech Innovations Inc. is a leading technology company focused on creating innovative solutions that transform industries. We pride ourselves on our collaborative culture and commitment to employee growth.',
    created_at: new Date().toISOString(),
    jobTitle: 'Senior Software Engineer',
    companyName: 'Tech Innovations Inc.'
  },
  {
    id: 'sample-2',
    title: 'Product Manager',
    company_name: 'Digital Solutions LLC',
    location: 'New York, NY',
    salary: 95000,
    currency: '$',
    pay_frequency: 'year',
    status: 'active',
    job_type: 'Full-time',
    location_type: 'Remote',
    description: 'Join our team as a Product Manager where you will drive the vision and execution of our product roadmap. You will work closely with engineering, design, and stakeholders to deliver exceptional products.',
    responsibilities: '• Define product vision and strategy\n• Gather and prioritize product requirements\n• Work with engineering teams to deliver products\n• Analyze market trends and competitor offerings\n• Present product updates to stakeholders',
    skills: 'Product management, Agile/Scrum, Data analysis, Communication, Strategic thinking, User research',
    additional_compensation: 'Performance bonuses, Professional development budget',
    employee_benefits: 'Comprehensive health coverage, Remote work setup stipend, Learning & development programs, Flexible hours',
    company_description: 'Digital Solutions LLC is a fast-growing company specializing in digital transformation services. We help businesses leverage technology to achieve their goals and stay competitive in the digital age.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    jobTitle: 'Product Manager',
    companyName: 'Digital Solutions LLC'
  }
];

