import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for goals
import { Loader2 } from 'lucide-react'; // Import Loader icon

// Helper to convert Date objects to a readable date string
const formatLocalDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString();
};

// Define types for better type safety
interface Goal {
  id: string;
  description: string;
  targetDate: string | null; // Storing dates as ISO strings
  completed: boolean;
}

interface StudyPlan {
  userId: string;
  goals: Goal[];
  subjects: string[];
  lastUpdated: string; // Storing date as ISO string
}

interface StudyPlannerProps {
    textDark: string;
    cardBg: string;
    secondaryBg: string;
    accentClass: string;
}

const StudyPlanner: React.FC<StudyPlannerProps> = ({ textDark, cardBg, secondaryBg, accentClass }) => {
  // We'll use a fixed userId for local storage as it's not multi-user by nature
  const userId = 'localUser123';
  const localStorageKey = `studyPlan_${userId}`; // Unique key for this user's data
  
  // Custom Color Constants based on the global theme accent
  const ACCENT_PINK_TEXT = 'text-[#EC4899]'; // Fuchsia
  const PINK_RING = 'focus:ring-[#EC4899]';
  const TEXT_LIGHT = 'text-gray-100'; // Used for internal goal/subject text

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Load Study Plan from Local Storage on Mount ---
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(localStorageKey);
      if (storedPlan) {
        setStudyPlan(JSON.parse(storedPlan));
      } else {
        const defaultPlan: StudyPlan = {
          userId: userId,
          goals: [],
          subjects: [],
          lastUpdated: new Date().toISOString(),
        };
        setStudyPlan(defaultPlan);
        localStorage.setItem(localStorageKey, JSON.stringify(defaultPlan));
      }
    } catch (e: any) {
      console.error("Error loading study plan from local storage:", e);
      setError("Failed to load study plan from local storage.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Save Study Plan to Local Storage whenever it changes ---
  useEffect(() => {
    if (studyPlan && !loading) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(studyPlan));
      } catch (e: any) {
        console.error("Error saving study plan to local storage:", e);
        setError("Failed to save study plan to local storage.");
      }
    }
  }, [studyPlan, loading]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalDescription.trim()) return;
    
    try {
      const newGoal: Goal = {
        id: uuidv4(),
        description: newGoalDescription.trim(),
        targetDate: newGoalTargetDate ? new Date(newGoalTargetDate).toISOString() : null,
        completed: false,
      };

      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: [...(currentPlan.goals || []), newGoal],
          lastUpdated: new Date().toISOString(),
        };
      });
      setNewGoalDescription('');
      setNewGoalTargetDate('');
    } catch (err: any) {
      console.error("Error adding goal:", err);
      setError("Failed to add goal.");
    } 
  };

  const handleToggleGoalCompletion = (goalId: string) => {
    if (!studyPlan) return;

    try {
      const updatedGoals = studyPlan.goals.map((goal: Goal) =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      );
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: updatedGoals,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error("Error toggling goal completion:", err);
      setError("Failed to update goal.");
    } 
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!studyPlan) return;

    try {
      const updatedGoals = studyPlan.goals.filter((goal: Goal) => goal.id !== goalId);
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          goals: updatedGoals,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error("Error deleting goal:", err);
      setError("Failed to delete goal.");
    } 
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    try {
      const updatedSubjects = [...(studyPlan?.subjects || []), newSubject.trim()];
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          subjects: Array.from(new Set(updatedSubjects)), // Ensure unique subjects
          lastUpdated: new Date().toISOString(),
        };
      });
      setNewSubject('');
    } catch (err: any) {
      console.error("Error adding subject:", err);
      setError("Failed to add subject.");
    } 
  };

  const handleDeleteSubject = (subjectToDelete: string) => {
    if (!studyPlan) return;

    try {
      const updatedSubjects = studyPlan.subjects.filter((subject: string) => subject !== subjectToDelete);
      setStudyPlan((prevPlan: StudyPlan | null) => {
        const currentPlan: StudyPlan = prevPlan || { userId: userId, goals: [], subjects: [], lastUpdated: new Date().toISOString() };
        return {
          ...currentPlan,
          subjects: updatedSubjects,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error("Error deleting subject:", err);
      setError("Failed to delete subject.");
    } 
  };

  // Calculate progress safely
  const currentGoals = studyPlan?.goals || [];
  const incompleteGoals = currentGoals.filter(g => !g.completed);
  const completedGoals = currentGoals.filter(g => g.completed);
  const completedGoalsCount = completedGoals.length;
  const totalGoalsCount = currentGoals.length;
  const progressWidth = totalGoalsCount > 0 ? (completedGoalsCount / totalGoalsCount) * 100 : 0;


  if (loading || !studyPlan) {
    return (
      <div className={`p-6 rounded-xl shadow-xl text-center ${cardBg} ${textDark}`}>
         <Loader2 className="animate-spin mx-auto h-8 w-8 text-[#EC4899] mb-4" />
         <p>Loading Study Plan...</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl p-6 rounded-xl shadow-xl ${cardBg} ${textDark} border border-[#EC4899]/50`}>
      <h2 className={`text-2xl font-bold ${ACCENT_PINK_TEXT} mb-4`}>📚 Your Study Planner</h2>
      <p className="text-gray-400 mb-6">
        Hello, <span className={`font-bold ${ACCENT_PINK_TEXT}`}>{userId || 'Guest'}</span>! Track your progress and set your goals.
      </p>

      {error && (
        <div className="p-4 mb-4 bg-red-900/40 text-red-300 border-l-4 border-red-500 rounded-lg">
          Error: {error}
        </div>
      )}

      {/* Progress Dashboard */}
      <div className={`${secondaryBg} p-6 rounded-xl shadow-inner mb-6 border border-gray-700`}>
        <h3 className={`text-xl font-semibold ${TEXT_LIGHT} mb-4`}>Your Progress Dashboard</h3>
        <p className="text-gray-400">
          Track your overall goal completion here.
        </p>
        <div className="mt-4 w-full bg-gray-700 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {completedGoalsCount} out of {totalGoalsCount} goals completed. ({progressWidth.toFixed(0)}%)
        </p>
      </div>
      
      {/* Add New Goal */}
      <div className={`${secondaryBg} p-6 rounded-xl shadow-inner mb-6 border border-gray-700`}>
        <h3 className={`text-xl font-semibold ${TEXT_LIGHT} mb-4`}>Set a New Study Goal</h3>
        <form onSubmit={handleAddGoal} className="space-y-4">
          <input
            type="text"
            value={newGoalDescription}
            onChange={(e) => setNewGoalDescription(e.target.value)}
            placeholder="e.g., Master React Hooks"
            className={`w-full p-3 rounded-lg border border-gray-600 bg-gray-800 ${TEXT_LIGHT} placeholder-gray-500 focus:ring-2 ${PINK_RING}`}
            required
          />
          <input
            type="date"
            value={newGoalTargetDate}
            onChange={(e) => setNewGoalTargetDate(e.target.value)}
            className={`w-full p-3 rounded-lg border border-gray-600 bg-gray-800 ${TEXT_LIGHT} focus:ring-2 ${PINK_RING}`}
          />
          <button
            type="submit"
            disabled={!newGoalDescription.trim()}
            className={`w-full text-white py-3 px-6 rounded-lg ${accentClass} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:ring-offset-2 focus:ring-offset-[#1E293B] transition duration-200 shadow-md disabled:opacity-50`}
          >
            Add Goal
          </button>
        </form>
      </div>

      {/* Your Active Study Goals */}
      <div className={`${secondaryBg} p-6 rounded-xl shadow-inner mb-6 border border-gray-700`}>
        <h3 className={`text-xl font-semibold ${TEXT_LIGHT} mb-4`}>Your Active Goals ({incompleteGoals.length})</h3>
        {incompleteGoals.length > 0 ? (
          <ul className="space-y-3">
            {incompleteGoals.map((goal: Goal) => (
              <li
                key={goal.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors bg-gray-800 shadow-sm border border-gray-700`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => handleToggleGoalCompletion(goal.id)}
                    className="mr-3 h-5 w-5 appearance-none border-2 border-pink-400 rounded-md bg-transparent checked:bg-pink-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-[#1E293B] transition duration-200 cursor-pointer"
                  />
                  <span className={`text-lg ${TEXT_LIGHT}`}>
                    {goal.description}
                    {goal.targetDate && (
                      <span className="text-sm text-gray-400 ml-2"> (Target: {formatLocalDate(goal.targetDate)})</span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition-all rounded-full hover:bg-gray-700"
                  aria-label="Delete goal"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No active goals. Time to set some new challenges!</p>
        )}
      </div>
      
      {/* Your Subjects */}
      <div className={`${secondaryBg} p-6 rounded-xl shadow-inner mb-6 border border-gray-700`}>
        <h3 className={`text-xl font-semibold ${TEXT_LIGHT} mb-4`}>Your Subjects</h3>
        <form onSubmit={handleAddSubject} className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add a subject (e.g., Biology)"
            className={`flex-grow p-3 rounded-lg border border-gray-600 bg-gray-800 ${TEXT_LIGHT} placeholder-gray-500 focus:ring-2 ${PINK_RING}`}
          />
          <button
            type="submit"
            className={`text-white py-3 px-6 rounded-lg ${accentClass} hover:opacity-90 transition duration-200 shadow-md`}
            disabled={!newSubject.trim()}
          >
            Add
          </button>
        </form>
        {studyPlan?.subjects && studyPlan.subjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {studyPlan.subjects.map((subject: string) => (
              <span
                key={subject}
                className="inline-flex items-center bg-pink-900/50 text-pink-300 text-sm font-medium px-3 py-1.5 rounded-full shadow-sm border border-pink-700"
              >
                {subject}
                <button
                  onClick={() => handleDeleteSubject(subject)}
                  className="ml-2 -mr-1 h-4 w-4 text-pink-400 hover:text-pink-200"
                  aria-label={`Remove ${subject}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No subjects added yet.</p>
        )}
      </div>

      {/* Your Completed Study Goals */}
      <div className={`${secondaryBg} p-6 rounded-xl shadow-inner mb-6 border border-gray-700`}>
        <h3 className={`text-xl font-semibold ${TEXT_LIGHT} mb-4`}>✅ Completed Goals ({completedGoals.length})</h3>
        {completedGoals.length > 0 ? (
          <ul className="space-y-3">
            {completedGoals.map((goal: Goal) => (
              <li
                key={goal.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all bg-gray-800 shadow-sm border border-gray-700`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => handleToggleGoalCompletion(goal.id)}
                    className="mr-3 h-5 w-5 appearance-none border-2 border-green-400 rounded-md bg-transparent checked:bg-green-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-[#1E293B] transition duration-200 cursor-pointer"
                  />
                  <span className={`text-lg line-through text-gray-500`}>
                    {goal.description}
                    {goal.targetDate && (
                      <span className="text-sm text-gray-600 ml-2"> (Target: {formatLocalDate(goal.targetDate)})</span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition-all rounded-full hover:bg-gray-700"
                  aria-label="Delete goal"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No goals completed yet. Keep pushing!</p>
        )}
      </div>

      {/* Progress Dashboard - Placeholder for future integration */}
      <div className={`${secondaryBg} p-6 rounded-xl shadow-inner border border-gray-700`}>
        <h3 className={`text-xl font-semibold ${TEXT_LIGHT} mb-4`}>AI Study Insights</h3>
        <p className="text-gray-400">
          This section will display your quiz scores, flashcard mastery, and study session durations over time.
        </p>
        <div className="mt-4 w-full bg-gray-700 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${progressWidth}%` }} // Using the safely calculated progressWidth
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {completedGoalsCount} out of {totalGoalsCount} goals completed.
        </p>
      </div>
    </div>
  );
};

export default StudyPlanner;