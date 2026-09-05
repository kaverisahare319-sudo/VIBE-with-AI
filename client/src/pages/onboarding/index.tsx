import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { ArrowRight, ArrowLeft, CheckCircle2, Briefcase, GraduationCap, Code2, BookOpen, User, Sparkles } from 'lucide-react';
import '../../styles/grid-background.css';

interface OnboardingData {
  qualification: string;
  status: string;
  year: string;
  specialization: string;
  careerGoal: string;
  industryInterest: string[];
  technologies: string[];
  skillsToImprove: string[];
  technicalLevel: string;
}

const defaultData: OnboardingData = {
  qualification: '',
  status: '',
  year: '',
  specialization: '',
  careerGoal: '',
  industryInterest: [],
  technologies: [],
  skillsToImprove: [],
  technicalLevel: '',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('onboarding_progress');
    if (saved) {
      try { return JSON.parse(saved).step || 1; } catch (e) { return 1; }
    }
    return 1;
  });
  const [data, setData] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem('onboarding_progress');
    if (saved) {
      try { return JSON.parse(saved).data || defaultData; } catch (e) { return defaultData; }
    }
    return defaultData;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('onboarding_progress', JSON.stringify({ step, data }));
  }, [step, data]);

  // If already onboarded, redirect to dashboard
  useEffect(() => {
    if (user?.completedOnboarding) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleNext = React.useCallback(() => setStep((s) => Math.min(s + 1, 7)), []);
  const handleBack = React.useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const handleFinish = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5005/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save onboarding data');

      localStorage.removeItem('onboarding_progress');
      updateUser({ completedOnboarding: true });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [data, navigate, updateUser]);

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    setData((prev) => {
      const arr = prev[field] as string[];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter((i) => i !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
  };

  // Validators for each step
  const isStepValid = React.useCallback(() => {
    switch (step) {
      case 1:
        if (!data.qualification) return false;
        if (!data.status) return false;
        if (data.status === 'Pursuing' && !data.year) return false;
        return true;
      case 2:
        return !!data.specialization;
      case 3:
        return !!data.careerGoal;
      case 4:
        return data.industryInterest.length > 0;
      case 5:
        return data.technologies.length > 0;
      case 6:
        return data.skillsToImprove.length > 0;
      case 7:
        return !!data.technicalLevel;
      default:
        return false;
    }
  }, [step, data]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isStepValid()) {
        if (step < 7) handleNext();
        else handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, data, isStepValid, handleNext, handleFinish]);

  return (
    <div className="min-h-screen bg-slate-50 grid-bg flex flex-col pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        
        {/* Header & Progress */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-display">Personalize Your Experience</h2>
          <p className="mt-2 text-slate-600">Help us tailor MockMate AI to your specific career goals.</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
            <span>Step {step} of 7</span>
            <span>{Math.round((step / 7) * 100)}% Completed</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card bg-white p-8 rounded-2xl shadow-xl relative overflow-hidden border border-slate-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="min-h-[300px]">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                    What's your highest qualification?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['Diploma', 'B.Tech / B.E.', 'BCA', 'B.Sc.', 'MCA', 'M.Tech', 'MBA', 'M.Sc.', 'PhD', 'Other'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setData({ ...data, qualification: q, status: '', year: '' })}
                        className={`p-3 text-sm rounded-xl border-2 transition-all ${
                          data.qualification === q
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {data.qualification && (
                  <div className="animate-fade-in pt-4 border-t border-slate-100">
                    <label className="block text-lg font-semibold text-slate-900 mb-3">Current Status</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Pursuing', 'Completed', 'Dropped / Discontinued', 'Other'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setData({ ...data, status: s, year: '' })}
                          className={`p-3 text-sm rounded-xl border-2 transition-all ${
                            data.status === s
                              ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                              : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {data.status === 'Pursuing' && (
                  <div className="animate-fade-in pt-4 border-t border-slate-100">
                    <label className="block text-lg font-semibold text-slate-900 mb-3">Which year?</label>
                    <div className="flex gap-3">
                      {['1st Year', '2nd Year', '3rd Year', 'Final Year'].map((y) => (
                        <button
                          key={y}
                          onClick={() => setData({ ...data, year: y })}
                          className={`flex-1 p-2 text-sm rounded-xl border-2 transition-all ${
                            data.year === y
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                              : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <label className="block text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  What is your specialization or field of study?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Computer Engineering', 'Information Technology', 'AI & Data Science',
                    'AI & Machine Learning', 'Electronics & Telecom', 'Mechanical Engineering',
                    'Civil Engineering', 'Electrical Engineering', 'Other'
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setData({ ...data, specialization: s })}
                      className={`p-4 text-sm rounded-xl border-2 text-left transition-all ${
                        data.specialization === s
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <label className="block text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-500" />
                  What is your primary career goal?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Software Developer', 'Full Stack Developer', 'Data Analyst',
                    'Data Scientist', 'AI/ML Engineer', 'Cloud Engineer',
                    'DevOps Engineer', 'Cybersecurity Engineer', 'Product Manager',
                    'UI/UX Designer', 'Entrepreneur', 'Other'
                  ].map((g) => (
                    <button
                      key={g}
                      onClick={() => setData({ ...data, careerGoal: g })}
                      className={`p-3 text-sm rounded-xl border-2 transition-all ${
                        data.careerGoal === g
                          ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium shadow-sm'
                          : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <label className="block text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  Which industries are you interested in?
                </label>
                <p className="text-sm text-slate-500 mb-4">Select all that apply</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Product-Based Companies', 'Service-Based Companies', 'Startups',
                    'FinTech', 'Healthcare Tech', 'E-Commerce', 'EdTech',
                    'Gaming', 'AI & Robotics', 'Government Sector', 'Other'
                  ].map((i) => {
                    const isSelected = data.industryInterest.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleArrayItem('industryInterest', i)}
                        className={`p-3 text-sm rounded-xl border-2 flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {i}
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <label className="block text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-500" />
                  Which technologies do you know?
                </label>
                <p className="text-sm text-slate-500 mb-4">Select all that apply</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    'C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL',
                    'HTML/CSS', 'React', 'Node.js', 'AWS', 'Git/GitHub', 'Docker', 'Other'
                  ].map((t) => {
                    const isSelected = data.technologies.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleArrayItem('technologies', t)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                            : 'border-slate-200 hover:border-indigo-200 text-slate-700 bg-white'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <div className="space-y-6 animate-fade-in">
                <label className="block text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  Which skills do you want to improve?
                </label>
                <p className="text-sm text-slate-500 mb-4">Select all that apply</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Data Structures & Algorithms', 'Problem Solving', 'Web Development',
                    'Mobile App Development', 'Data Science', 'AI/ML', 'Cloud Computing',
                    'Cybersecurity', 'Aptitude', 'Communication Skills', 'Resume Building',
                    'Interview Preparation'
                  ].map((s) => {
                    const isSelected = data.skillsToImprove.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleArrayItem('skillsToImprove', s)}
                        className={`p-3 text-sm rounded-xl border-2 flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-pink-500 bg-pink-50 text-pink-700 font-medium'
                            : 'border-slate-200 hover:border-pink-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {s}
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 7 */}
            {step === 7 && (
              <div className="space-y-6 animate-fade-in">
                <label className="block text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  How would you rate your current technical level?
                </label>
                <div className="grid grid-cols-1 gap-4 mt-6">
                  {[
                    { label: 'Beginner', desc: 'Just starting out, learning the basics' },
                    { label: 'Intermediate', desc: 'Can build projects, know core concepts' },
                    { label: 'Advanced', desc: 'Comfortable with complex problems and architecture' }
                  ].map((lvl) => (
                    <button
                      key={lvl.label}
                      onClick={() => setData({ ...data, technicalLevel: lvl.label })}
                      className={`p-4 text-left rounded-xl border-2 transition-all ${
                        data.technicalLevel === lvl.label
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className={`font-semibold text-lg ${data.technicalLevel === lvl.label ? 'text-blue-700' : 'text-slate-800'}`}>
                        {lvl.label}
                      </div>
                      <div className={`text-sm mt-1 ${data.technicalLevel === lvl.label ? 'text-blue-600' : 'text-slate-500'}`}>
                        {lvl.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                step === 1
                  ? 'text-transparent cursor-default'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            
            {step < 7 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!isStepValid() || loading}
                className="flex items-center px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Saving Profile...' : 'Complete Setup'} <Sparkles className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
