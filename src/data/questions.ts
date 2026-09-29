import { InterviewQuestion } from '../types/interview';

export const QUESTION_BANK: InterviewQuestion[] = [
  // Software Engineer
  {
    id: 'swe-1',
    role: 'Software Engineer',
    text: 'Explain a time you had to debug a critical production outage under tight deadlines.',
    category: 'Behavioral',
  },
  {
    id: 'swe-2',
    role: 'Software Engineer',
    text: 'How do you approach designing a resilient distributed system with high availability and low latency?',
    category: 'System Design',
  },
  {
    id: 'swe-3',
    role: 'Software Engineer',
    text: 'Describe how you manage technical debt while maintaining rapid feature delivery velocity.',
    category: 'Leadership',
  },
  {
    id: 'swe-4',
    role: 'Software Engineer',
    text: 'Walk me through a complex concurrency or memory management bug you diagnosed and resolved.',
    category: 'Technical',
  },

  // Product Manager
  {
    id: 'pm-1',
    role: 'Product Manager',
    text: 'How do you prioritize competing requests between enterprise clients, internal stakeholders, and consumer end-users?',
    category: 'Behavioral',
  },
  {
    id: 'pm-2',
    role: 'Product Manager',
    text: 'Walk me through a product launch that failed to hit key performance indicators (KPIs) and what adjustments you made.',
    category: 'Leadership',
  },
  {
    id: 'pm-3',
    role: 'Product Manager',
    text: 'How do you define and validate product-market fit when launching a novel AI-driven feature?',
    category: 'Technical',
  },
  {
    id: 'pm-4',
    role: 'Product Manager',
    text: 'How do you foster alignment between engineering velocity and business revenue goals?',
    category: 'Leadership',
  },

  // HR Specialist / People Ops
  {
    id: 'hr-1',
    role: 'HR Specialist / People Ops',
    text: 'How do you mediate a high-stakes interpersonal conflict between two senior department leaders?',
    category: 'Behavioral',
  },
  {
    id: 'hr-2',
    role: 'HR Specialist / People Ops',
    text: 'What methodology and evaluation metrics do you employ to build an equitable, unbiased hiring pipeline?',
    category: 'Technical',
  },
  {
    id: 'hr-3',
    role: 'HR Specialist / People Ops',
    text: 'Describe your strategy for diagnosing root causes of voluntary employee turnover and executing retention initiatives.',
    category: 'Leadership',
  },
  {
    id: 'hr-4',
    role: 'HR Specialist / People Ops',
    text: 'How do you structure a performance improvement plan (PIP) that genuinely empowers and coaches an underperforming team member?',
    category: 'Behavioral',
  },
];
