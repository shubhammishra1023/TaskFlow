import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { TodoDashboard } from './components/TodoDashboard';
import { Loader2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-3" />
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Initializing Firebase Session...</p>
      </div>
    );
  }

  return user ? <TodoDashboard /> : <AuthScreen />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-100 dark:selection:bg-indigo-900/60 selection:text-indigo-950 dark:selection:text-indigo-200 transition-colors duration-200">
          <Navbar />
          <main className="flex-1">
            <MainContent />
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

