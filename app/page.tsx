'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Loader2 } from 'lucide-react'
import StudyPlanner from '../components/StudyPlanner'; // Assuming the StudyPlanner component is in '../components/StudyPlanner.tsx'

// --- Theme Constants (DARK HACKER THEME) ---
// These override the outdated constants provided in the file and match the global.css and components/StudyPlanner.
const PRIMARY_BG = 'bg-gray-950'; // Near black (Body Background)
const TEXT_DARK = 'text-gray-100'; // Light text (Primary Text Color)
const CARD_BG = 'bg-[#1E293B]'; // Dark Slate (Main Feature/Card Container)
const SECONDARY_BG = 'bg-gray-800'; // Darker Gray (Input backgrounds, secondary panels within cards)
const ACCENT_CLASS = 'hacker-gradient'; // Custom class from global.css (fuchsia gradient)
const ACCENT_HEX = '#EC4899'; // Fuchsia hex for rings/borders

// Interface definitions (kept for main component scope)
interface Flashcard {
  front: string
  back: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface Goal {
  id: string
  description: string
  targetDate: string | null
  completed: boolean
}

interface StudyPlan {
  userId: string
  goals: Goal[];
  subjects: string[];
  lastUpdated: string
}

// Helper to convert Date objects to a readable date string
const formatLocalDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString();
};

export default function LearnAI() {
  const [activeTab, setActiveTab] = useState('studyPlanner')
  const [loading, setLoading] = useState(false)

  // Flashcard states
  const [notes, setNotes] = useState('')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Quiz states
  const [quizText, setQuizText] = useState('')
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  // Study Buddy states
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [chatHistory, setChatHistory] = useState<{ question: string, answer: string }[]>([])

  // Study Planner states (Needed here for visibility/persistence logic)
  const userId = 'localUser123';
  const localStorageKey = `studyPlan_${userId}`;
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [studyPlannerError, setStudyPlannerError] = useState<string | null>(null);

  // --- Study Planner: Load from Local Storage on Mount ---
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
      setStudyPlannerError("Failed to load study plan from local storage.");
    }
  }, []);

  // --- Study Planner: Save to Local Storage whenever studyPlan changes ---
  useEffect(() => {
    if (studyPlan) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(studyPlan));
      } catch (e: any) {
        console.error("Error saving study plan to local storage:", e);
        setStudyPlannerError("Failed to save study plan to local storage.");
      }
    }
  }, [studyPlan]);

  // --- Study Planner: Handler stubs (Full logic moved to component, but needed here if directly called) ---
  const handleAddGoal = (e: React.FormEvent) => { /* Logic would be here if not componentized */ e.preventDefault(); };
  const handleToggleGoalCompletion = (goalId: string) => { /* Logic removed */ };
  const handleDeleteGoal = (goalId: string) => { /* Logic removed */ };
  const handleAddSubject = (e: React.FormEvent) => { /* Logic removed */ e.preventDefault(); };
  const handleDeleteSubject = (subjectToDelete: string) => { /* Logic removed */ };
  const currentGoals = studyPlan?.goals || [];
  const completedGoalsCount = currentGoals.filter(g => g.completed).length;
  const totalGoalsCount = currentGoals.length;


  // Flashcard methods
  const generateFlashcards = async () => {
    if (!notes.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      const data = await response.json()
      if (data.flashcards) {
        setFlashcards(data.flashcards)
        setCurrentCard(0)
        setFlipped(false)
      }
    } catch (error) {
      console.error('Error generating flashcards:', error)
    }
    setLoading(false)
  }

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1)
      setFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setFlipped(false)
    }
  }

  // Quiz methods
  const generateQuiz = async () => {
    if (!quizText.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: quizText })
      })

      const data = await response.json()
      if (data.quiz) {
        setQuiz(data.quiz)
        setCurrentQuestion(0)
        setSelectedAnswer(null)
        setShowResults(false)
        setScore(0)
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
    }
    setLoading(false)
  }

  const selectAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex)

    setTimeout(() => {
      let finalScore = 0;
      
      if (answerIndex === quiz[currentQuestion].correct) {
          finalScore = score + 1;
      } else {
          finalScore = score;
      }

      if (currentQuestion < quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setScore(finalScore);
      } else {
        setShowResults(true)
        setScore(finalScore);
      }
    }, 1500)
  }

  // Study Buddy methods
  const askStudyBuddy = async () => {
    if (!question.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/studybuddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const data = await response.json()
      if (data.answer) {
        const newChat = { question, answer: data.answer }
        setChatHistory(prev => [...prev, newChat])
        setAnswer(data.answer)
        setQuestion('')
      }
    } catch (error) {
      console.error('Error asking study buddy:', error)
    }
    setLoading(false)
  }
  
  // Helper for accent buttons
  const AccentButton = ({ children, onClick, disabled = false, type = 'button' }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, type?: 'button' | 'submit' }) => (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      className={`mt-4 px-6 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${ACCENT_CLASS} ${disabled ? 'opacity-70' : 'hover:opacity-90'} flex items-center justify-center`}
    >
        {loading && disabled && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
        {!loading && children}
        {loading && !disabled && children}
    </button>
  );


  return (
    <div className={`min-h-screen ${PRIMARY_BG} ${TEXT_DARK}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold text-[#EC4899] mb-2`}>StudyBae</h1>
          <p className="text-gray-400 text-lg">AI-Powered Educational Tools</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className={`${CARD_BG} p-2 rounded-xl flex space-x-2 shadow-lg border border-[#EC4899]/50`}>
            {[
              { id: 'studyPlanner', label: '📚 Study Planner', desc: 'Set Goals' },
              { id: 'flashcards', label: '🃏 Flashcards', desc: 'Make Flashcards' },
              { id: 'quiz', label: '📝 Quiz', desc: 'Create Quiz' },
              { id: 'study-buddy', label: '🤖 Study Buddy', desc: 'Ask Questions' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl transition-colors ${TEXT_DARK} ${
                  activeTab === tab.id
                    ? `${ACCENT_CLASS} text-white shadow-md shadow-[#EC4899]/50`
                    : `${CARD_BG} hover:bg-gray-700`
                }`}
              >
                <div className="text-sm font-medium">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {/* Study Planner Tab */}
          {activeTab === 'studyPlanner' && (
            <StudyPlanner
                textDark={TEXT_DARK}
                cardBg={CARD_BG}
                secondaryBg={SECONDARY_BG}
                accentClass={ACCENT_CLASS}
            />
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && (
            <div className={`${CARD_BG} rounded-xl p-6 shadow-xl border border-[#EC4899]/50`}>
              <h2 className={`text-2xl font-bold ${TEXT_DARK} mb-4`}>🃏 Flashcard Maker</h2>

              {flashcards.length === 0 ? (
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste your study notes here and I'll create flashcards for you..."
                    className={`w-full h-40 p-4 rounded-lg border-2 border-gray-700 ${SECONDARY_BG} ${TEXT_DARK} placeholder-gray-500 focus:ring-2 focus:ring-[#EC4899] resize-none`}
                  />
                  <AccentButton 
                    onClick={generateFlashcards} 
                    disabled={!notes.trim()}
                  >
                    {loading ? 'Generating...' : 'Generate Flashcards'}
                  </AccentButton>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-gray-400">
                    Card {currentCard + 1} of {flashcards.length}
                  </div>
                  <div
                    className={`flashcard ${flipped ? 'flipped' : ''} mb-6 cursor-pointer`}
                    onClick={() => setFlipped(!flipped)}
                  >
                    <div className="flashcard-inner">
                      {/* flashcard-front and flashcard-back use CSS gradients */}
                      <div className="flashcard-front">
                        <p className="text-xl font-medium">{flashcards[currentCard]?.front}</p>
                      </div>
                      <div className="flashcard-back">
                        <p className="text-xl">{flashcards[currentCard]?.back}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={prevCard}
                      disabled={currentCard === 0}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors font-medium"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFlashcards([])}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                    >
                      New Flashcards
                    </button>
                    <button
                      onClick={nextCard}
                      disabled={currentCard === flashcards.length - 1}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className={`${CARD_BG} rounded-xl p-6 shadow-xl border border-[#EC4899]/50`}>
              <h2 className={`text-2xl font-bold ${TEXT_DARK} mb-4`}>📝 Quiz Maker</h2>

              {quiz.length === 0 && !showResults ? (
                <div>
                  <textarea
                    value={quizText}
                    onChange={(e) => setQuizText(e.target.value)}
                    placeholder="Paste text here and I'll create a quiz for you..."
                    className={`w-full h-40 p-4 rounded-lg border-2 border-gray-700 ${SECONDARY_BG} ${TEXT_DARK} placeholder-gray-500 focus:ring-2 focus:ring-[#EC4899] resize-none`}
                  />
                  <AccentButton 
                    onClick={generateQuiz}
                    disabled={!quizText.trim()}
                  >
                    {loading ? 'Creating Quiz...' : 'Create Quiz'}
                  </AccentButton>
                </div>
              ) : showResults ? (
                <div className="text-center">
                  <h3 className={`text-3xl font-bold ${TEXT_DARK} mb-4`}>Quiz Complete!</h3>
                  <p className="text-xl text-gray-400 mb-6">
                    You scored {score} out of {quiz.length} ({Math.round((score / quiz.length) * 100)}%)
                  </p>
                  <AccentButton
                    onClick={() => {
                      setQuiz([])
                      setShowResults(false)
                      setScore(0)
                    }}
                  >
                    Take Another Quiz
                  </AccentButton>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-gray-400">
                    Question {currentQuestion + 1} of {quiz.length}
                  </div>

                  <div className="mb-6">
                    <h3 className={`text-xl font-bold ${TEXT_DARK} mb-4`}>
                      {quiz[currentQuestion]?.question}
                    </h3>

                    <div className="space-y-3">
                      {quiz[currentQuestion]?.options.map((option, index) => {
                        const isCorrectOption = index === quiz[currentQuestion].correct;
                        const isSelected = selectedAnswer === index;
                        const isAnswered = selectedAnswer !== null;

                        let optionClasses = `${SECONDARY_BG} ${TEXT_DARK} hover:bg-gray-700 border-gray-700`; // Default dark mode hover

                        if (isAnswered) {
                            if (isCorrectOption) {
                                // Use global.css `quiz-option.correct` class (green gradient)
                                optionClasses = 'quiz-option correct';
                            } else if (isSelected) {
                                // Use global.css `quiz-option.incorrect` class (red gradient)
                                optionClasses = 'quiz-option incorrect';
                            } else {
                                // Mute non-selected, incorrect options
                                optionClasses = 'bg-gray-800 text-gray-600 border-gray-800';
                            }
                        } else if (isSelected) {
                             // Highlight user selection before answer reveal
                             optionClasses = `${ACCENT_CLASS} text-white`;
                        }

                        return (
                          <button
                            key={index}
                            onClick={() => selectAnswer(index)}
                            disabled={isAnswered}
                            className={`w-full p-4 text-left rounded-lg transition-all quiz-option font-medium shadow-sm border ${optionClasses}`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>

                    {selectedAnswer !== null && (
                      <div className="mt-4 p-4 bg-gray-800 border-l-4 border-[#EC4899] rounded-lg">
                        <p className="text-gray-400 font-medium">Explanation:</p>
                        <p className="text-gray-300">{quiz[currentQuestion]?.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          
          {activeTab === 'study-buddy' && (
            <div className={`${CARD_BG} rounded-xl p-6 shadow-xl border border-[#EC4899]/50`}>
              <h2 className={`text-2xl font-bold ${TEXT_DARK} mb-4`}>🤖 Ask-Me Study Buddy</h2>

              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask me anything you want to learn about..."
                    className={`flex-1 p-4 rounded-lg border-2 border-gray-700 ${SECONDARY_BG} ${TEXT_DARK} placeholder-gray-500 focus:ring-2 focus:ring-[#EC4899]`}
                    onKeyDown={(e) => e.key === 'Enter' && askStudyBuddy()}
                  />
                  <AccentButton 
                    onClick={askStudyBuddy}
                    disabled={!question.trim()}
                  >
                    {loading ? 'Thinking...' : 'Ask'}
                  </AccentButton>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                {chatHistory.map((chat, index) => (
                  <div key={index} className="space-y-2">
                    <div className={`bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-600 ${TEXT_DARK}`}>
                      <p className="text-gray-400 font-medium">You:</p>
                      <p className="text-gray-200">{chat.question}</p>
                    </div>
                    <div className={`bg-pink-900/40 p-4 rounded-lg shadow-md border border-pink-700 ${TEXT_DARK}`}>
                      <p className="text-pink-300 font-medium">Study Buddy:</p>
                      <p className="text-gray-100">{chat.answer}</p>
                    </div>
                  </div>
                ))}

                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-500 py-8 italic">
                    Ask me anything and I'll help you learn! I can explain concepts, provide examples, and answer your questions.
                  </div>
                )}
              </div>
            </div>
          )}

          {/*  */}
        </div>
      </div>
    </div>
  )
}
