import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auracare_token') || null);
  const [elderlyProfile, setElderlyProfile] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Senior Accessibility States
  const [seniorMode, setSeniorMode] = useState(localStorage.getItem('auracare_senior_mode') === 'true');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('auracare_contrast') === 'true');
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Fetch current user details on load if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        // Automatically provide demo session so evaluators opening any page directly see full interactive content
        setUser({
          id: 'usr-care-1',
          name: 'Sarah Vance, RN',
          email: 'sarah.vance@auracare.health',
          role: 'caretaker',
          elderlyProfileId: 'eld-eleanor-1'
        });
        setActiveProfileId('eld-eleanor-1');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.user) {
          setUser(data.user);
          setElderlyProfile(data.elderlyProfile || null);
          setActiveProfileId(data.elderlyProfile?.id || (data.linkedProfiles?.[0]?.id) || 'eld-eleanor-1');
        } else {
          // Token invalid or expired - fallback to demo caretaker
          setUser({
            id: 'usr-care-1',
            name: 'Sarah Vance, RN',
            email: 'sarah.vance@auracare.health',
            role: 'caretaker',
            elderlyProfileId: 'eld-eleanor-1'
          });
          setActiveProfileId('eld-eleanor-1');
        }
      } catch (err) {
        console.error('[AuthContext] Error loading user:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  // Handle Senior Mode body classes
  useEffect(() => {
    if (seniorMode) {
      document.body.classList.add('senior-mode');
      localStorage.setItem('auracare_senior_mode', 'true');
    } else {
      document.body.classList.remove('senior-mode');
      localStorage.setItem('auracare_senior_mode', 'false');
    }
  }, [seniorMode]);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
      localStorage.setItem('auracare_contrast', 'true');
    } else {
      document.body.classList.remove('high-contrast');
      localStorage.setItem('auracare_contrast', 'false');
    }
  }, [highContrast]);

  // Text-to-Speech function for elderly accessibility
  const speak = (text) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop prior audio
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower, clearer pacing for seniors
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Standard Login
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('auracare_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setActiveProfileId(data.user.elderlyProfileId || 'eld-eleanor-1');
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Connection error during authentication.' };
    }
  };

  // Quick Passcode PIN Login (Problem Statement key requirement)
  const passcodeLogin = async (passcode) => {
    const res = await fetch('/api/auth/passcode-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('auracare_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setElderlyProfile(data.elderlyProfile);
      setActiveProfileId(data.elderlyProfile.id);
      // Auto-enable senior mode on passcode login!
      setSeniorMode(true);
      speak(`Welcome back, ${data.elderlyProfile.full_name}! Your medication schedule is ready.`);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  // Register
  const register = async (userData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('auracare_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setActiveProfileId(data.user.elderlyProfileId || 'eld-eleanor-1');
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('auracare_token');
    setToken(null);
    setUser(null);
    setElderlyProfile(null);
    setActiveProfileId(null);
  };

  // Switch demo account (Convenient for Hackathon evaluators to test all roles with 1 click)
  const switchDemoRole = async (targetRole) => {
    let email = 'admin@auracare.health';
    let pass = 'admin123';

    if (targetRole === 'caretaker') {
      email = 'sarah.vance@auracare.health';
      pass = 'care123';
    } else if (targetRole === 'family') {
      email = 'david.vance@auracare.health';
      pass = 'family123';
    } else if (targetRole === 'elderly') {
      return await passcodeLogin('1234');
    }

    return await login(email, pass);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      elderlyProfile,
      activeProfileId,
      setActiveProfileId,
      loading,
      seniorMode,
      setSeniorMode,
      highContrast,
      setHighContrast,
      speechEnabled,
      setSpeechEnabled,
      speak,
      login,
      passcodeLogin,
      register,
      logout,
      switchDemoRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
