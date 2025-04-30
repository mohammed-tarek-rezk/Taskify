import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import Profile from './pages/Profile';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-gray-100">
              <Navbar />
              <Notification />
              <main className="py-10">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/projects"
                    element={
                      <PrivateRoute>
                        <Projects />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/projects/:id"
                    element={
                      <PrivateRoute>
                        <ProjectDetails />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/tasks"
                    element={
                      <PrivateRoute>
                        <Tasks />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/tasks/:id"
                    element={
                      <PrivateRoute>
                        <TaskDetails />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/teams"
                    element={
                      <PrivateRoute>
                        <Teams />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/teams/:id"
                    element={
                      <PrivateRoute>
                        <TeamDetails />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 