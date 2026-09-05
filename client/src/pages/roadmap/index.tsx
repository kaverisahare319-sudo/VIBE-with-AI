import React, { useState } from 'react';
import {
  GitBranch,
  BookOpen,
  Award,
  Box,
  CheckCircle,
  FileCheck2,
  CalendarDays
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

interface RoadmapDetail {
  skills: string[];
  timeline: {
    title: string;
    duration: string;
    description: string;
    details: string[];
  }[];
  courses: { name: string; provider: string }[];
  certifications: string[];
  projects: string[];
}

export default function CareerRoadmap() {
  const [selectedRole, setSelectedRole] = useState<string>('Frontend Developer');

  const roles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'Data Scientist',
    'AI Engineer',
    'Machine Learning Engineer',
    'Software Engineer'
  ];

  const roadmapData: Record<string, RoadmapDetail> = {
    'Frontend Developer': {
      skills: ['HTML5 & CSS3', 'JavaScript (ES6+)', 'TypeScript', 'React.js', 'Tailwind CSS', 'Redux Toolkit', 'Next.js', 'Vesting / Testing (Jest)'],
      timeline: [
        { title: 'Phase 1: Web Standards & Logic', duration: 'Months 1-3', description: 'Master layout mechanics and fundamental JavaScript scripting.', details: ['Responsive Flexbox/Grid structures', 'Asynchronous JS operations & fetch integrations', 'Document Object Model (DOM) configurations'] },
        { title: 'Phase 2: Modern Framework Foundations', duration: 'Months 3-6', description: 'Develop single page state managers and component logic.', details: ['React hooks & custom lifecycle modules', 'Typescript typing & component structures', 'State managers (Redux / Zustand)'] },
        { title: 'Phase 3: Production & Deployments', duration: 'Months 6-12', description: 'Build server-rendered architectures and verify quality.', details: ['Next.js routing & server actions', 'Performance tracking (Lighthouse)', 'Automated component units testing (Jest/RTL)'] }
      ],
      courses: [
        { name: 'Modern React with Redux', provider: 'Udemy' },
        { name: 'Front-End Web Development Specialization', provider: 'Coursera (HKUST)' }
      ],
      certifications: ['Meta Front-End Developer Certificate', 'AWS Cloud Practitioner'],
      projects: ['E-Commerce Storefront with stripe checking', 'SaaS Dashboard mockup with glassmorphism CSS']
    },
    'Backend Developer': {
      skills: ['Node.js', 'Express.js', 'Python / Django', 'SQL (PostgreSQL)', 'NoSQL (MongoDB)', 'Redis', 'Docker', 'REST & GraphQL APIs'],
      timeline: [
        { title: 'Phase 1: Server Systems & SQL Databases', duration: 'Months 1-3', description: 'Setup local server logic, schema designs, and database queries.', details: ['Node/Express API setups', 'SQL normalization and indexes', 'JWT Authentication scripts'] },
        { title: 'Phase 2: System Architecture & Scale', duration: 'Months 3-6', description: 'Build caches, message queues, and modular services.', details: ['Redis session caching', 'NoSQL DB configurations', 'Microservice communications'] },
        { title: 'Phase 3: Containers & Orchestrations', duration: 'Months 6-12', description: 'Configure docker networks and host cloud infrastructures.', details: ['Dockerizing web apps', 'AWS EC2, RDS configurations', 'CI/CD pipeline deployments'] }
      ],
      courses: [
        { name: 'Node.js Developer Course', provider: 'Udemy' },
        { name: 'Database Management Systems Specialization', provider: 'Coursera (UC San Diego)' }
      ],
      certifications: ['Oracle Certified Professional: Java SE Developer', 'AWS Solutions Architect Associate'],
      projects: ['Real-time collaborative chat engine', 'Distributed Task Scheduler queue using Redis']
    },
    'AI Engineer': {
      skills: ['Python', 'PyTorch / TensorFlow', 'Transformers (HuggingFace)', 'Vector DBs (Pinecone)', 'LangChain', 'OpenAI APIs', 'LLM Fine-tuning'],
      timeline: [
        { title: 'Phase 1: Numerical Calculations & Models', duration: 'Months 1-3', description: 'Establish core math concepts, data modeling tools, and statistics.', details: ['Numpy & Pandas operations', 'Regression and classification modeling', 'Basic neural network structures'] },
        { title: 'Phase 2: Large Language Model Mechanics', duration: 'Months 3-6', description: 'Master retrieval-augmented generation models and prompt structures.', details: ['LangChain application chains', 'Vector database embedding index maps', 'Agent structures & tool usages'] },
        { title: 'Phase 3: Model Scale & Deployments', duration: 'Months 6-12', description: 'Serve endpoints, optimize model weights, and monitor drift.', details: ['FastAPI prediction engines', 'Fine-tuning models (QLoRA)', 'LLMOps (LangSmith/Weights & Biases)'] }
      ],
      courses: [
        { name: 'Generative AI with Large Language Models', provider: 'DeepLearning.AI (Coursera)' },
        { name: 'Natural Language Processing Specialization', provider: 'DeepLearning.AI' }
      ],
      certifications: ['TensorFlow Developer Certificate', 'Microsoft Certified: Azure AI Engineer Associate'],
      projects: ['RAG QA assistant matching target PDF documents', 'Custom fine-tuned LLaMA model acting as chat moderator']
    }
  };

  // Fallback for roles that are not explicitly defined in roadmapData
  const activeRoadmap = roadmapData[selectedRole] || roadmapData['Frontend Developer'];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-slate-800">Career Roadmap</h1>
        <p className="text-slate-500 text-sm mt-1">Select your target engineering role to visualize recommended learning milestones and certification checkpoints.</p>
      </div>

      {/* Role Selector Grid */}
      <div className="glass-card p-6 rounded-2xl mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Select Target Role</h3>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                selectedRole === role
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Main Roadmap Output */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Timeline Path */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center space-x-2 text-slate-800 mb-6">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold">Timeline Learning Path</h3>
            </div>

            <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-8">
              {activeRoadmap.timeline.map((step, idx) => (
                <div key={idx} className="relative text-left">
                  {/* Point icon */}
                  <span className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-blue-600 shadow-sm">
                    {idx + 1}
                  </span>
                  
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 rounded-md">
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{step.description}</p>
                  
                  <ul className="space-y-1.5">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-center text-xs text-slate-600 space-x-2">
                        <CheckCircle className="w-4.5 h-4.5 text-blue-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requirements and Courses */}
        <div className="space-y-6">
          {/* Required Skills */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center space-x-2 text-slate-800 mb-4">
              <GitBranch className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-sm">Required Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeRoadmap.skills.map((skill, i) => (
                <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100 rounded-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Courses & Certificates */}
          <div className="glass-card p-6 rounded-2xl space-y-5">
            <div>
              <div className="flex items-center space-x-2 text-slate-800 mb-3">
                <BookOpen className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-sm">Recommended Courses</h3>
              </div>
              <div className="space-y-2">
                {activeRoadmap.courses.map((course, i) => (
                  <div key={i} className="p-2 border border-slate-100 rounded-lg text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{course.name}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{course.provider}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center space-x-2 text-slate-800 mb-3">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm">Certification Targets</h3>
              </div>
              <div className="space-y-2">
                {activeRoadmap.certifications.map((cert, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-slate-600">
                    <FileCheck2 className="w-4 h-4 text-indigo-500" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested Projects */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center space-x-2 text-slate-800 mb-4">
              <Box className="w-5 h-5 text-pink-600" />
              <h3 className="font-bold text-sm">Suggested Projects</h3>
            </div>
            <div className="space-y-3">
              {activeRoadmap.projects.map((proj, i) => (
                <div key={i} className="p-3 border border-dashed border-slate-200 rounded-lg text-left bg-slate-50/50">
                  <span className="text-[10px] text-purple-600 font-bold uppercase">Project {i + 1}</span>
                  <p className="text-xs font-bold text-slate-800 leading-tight mt-1">{proj}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

