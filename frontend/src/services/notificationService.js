import { supabase } from '../lib/supabase.js';

export const notificationService = {
  /**
   * Fetch persistent notifications for the current user
   */
  async getUserNotifications(userId, role = 'patient') {
    const isDoctor = role?.toLowerCase() === 'doctor';

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[notificationService] Error fetching notifications:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(n => ({
      id: n.id,
      type: (n.type || 'SYSTEM').toLowerCase(),
      title: n.title,
      message: n.message,
      time: new Date(n.created_at).toLocaleString(),
      read: Boolean(n.read_at),
      link: isDoctor
        ? (n.type === 'APPOINTMENT' ? '/doctor/patients' : '/doctor/dashboard')
        : (n.type === 'DOCUMENT' ? '/patient/records' : '/patient/dashboard')
    }));
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('[notificationService] Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('[notificationService] Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Clear all user notifications
   */
  async clearAll(userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[notificationService] Error clearing notifications:', error);
      throw error;
    }
  },

  /**
   * Delete a single notification
   */
  async deleteOne(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('[notificationService] Error deleting notification:', error);
      throw error;
    }
  }
};

export default notificationService;
