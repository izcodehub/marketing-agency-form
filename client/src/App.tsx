import React from 'react';
import { ClientOnboardingForm } from './components/ClientOnboardingForm';
import { AdminDashboard } from './components/AdminDashboard';
import './App.css';

function App() {
  // Simple routing based on path
  const isAdminRoute = window.location.pathname === '/admin';

  return (
    <div className="App">
      {isAdminRoute ? <AdminDashboard /> : <ClientOnboardingForm />}
    </div>
  );
}

export default App;
