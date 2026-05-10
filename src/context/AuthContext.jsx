import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [profile, setProfile]         = useState(null);
  const [profileChecked, setProfileChecked] = useState(false); // true once fetch attempt done
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setLoading(false); setProfileChecked(true); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setProfileChecked(true); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) setProfile(data.profile_data);
    } catch (_) {
      // table may not exist yet — treat as no profile, don't crash
    } finally {
      setProfileChecked(true);
      setLoading(false);
    }
  };

  const saveProfile = async (profileData) => {
    if (!user) return new Error('Not logged in');
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, profile_data: profileData, updated_at: new Date().toISOString() });
    if (!error) setProfile(profileData);
    return error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileChecked(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, profileChecked, loading, saveProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
