import { useState, useEffect, useCallback } from 'react';
import { JobApplication } from '@/types/application';

const STORAGE_KEY = 'job-applications';

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setApplications(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored applications:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever applications change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    }
  }, [applications, isLoading]);

  const addApplication = useCallback((application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newApp: JobApplication = {
      ...application,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setApplications(prev => [newApp, ...prev]);
    return newApp;
  }, []);

  const updateApplication = useCallback((id: string, updates: Partial<JobApplication>) => {
    setApplications(prev => prev.map(app => 
      app.id === id 
        ? { ...app, ...updates, updatedAt: new Date().toISOString() }
        : app
    ));
  }, []);

  const deleteApplication = useCallback((id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id));
  }, []);

  const getApplication = useCallback((id: string) => {
    return applications.find(app => app.id === id);
  }, [applications]);

  return {
    applications,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication,
    getApplication,
  };
}
