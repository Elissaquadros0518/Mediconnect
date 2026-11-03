// src/services/patientService.js
import { supabase } from '../lib/supabase';

export const patientService = {
  // Fetch patient profile by user ID
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', userId)
      .single();
      
    // If the record doesn't exist yet, return null
    if (error && error.code === 'PGRST116') {
      return null;
    }
    
    if (error) throw error;
    return data;
  },

  // Create or Update patient profile in Supabase (Upsert)
  async updateProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('patients')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};