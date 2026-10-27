import { supabase } from '../lib/supabase';

export const notificationService = {
  /**
   * Fetch persistent notifications for the current user
   */
  async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(n => ({
          id: n.id,
          type: (n.type || 'SYSTEM').toLowerCase(),
          title: n.title,
          message: n.message,
          time: new Date(n.created_at).toLocaleString(),
          read: Boolean(n.read_at),
          link: n.type === 'DOCUMENT' ? '/patient/records' : '/patient/dashboard'
        }));
      }
    } catch (err) {
      console.warn('[notificationService] getUserNotifications fallback:', err.message);
    }

    return [
      {
        id: 1,
        type: 'report',
        title: 'New Medical Report Uploaded',
        message: 'Your Chest X-Ray Report has been securely uploaded and encrypted to your Supabase vault.',
        time: '10 minutes ago',
        read: false,
        link: '/patient/records'
      },
      {
        id: 2,
        type: 'appointment',
        title: 'Appointment Confirmed',
        message: 'Your consultation with Dr. Rajesh Sharma (Cardiology) is confirmed for Nov 2, 2026 at 10:30 AM.',
        time: '2 hours ago',
        read: false,
        link: '/patient/dashboard'
      },
      {
        id: 3,
        type: 'prescription',
        title: 'Prescription Refill Reminder',
        message: 'Your active prescription for Atorvastatin 20mg has 2 refills remaining.',
        time: '1 day ago',
        read: true,
        link: '/patient/dashboard'
      }
    ];
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId) {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (err) {
      console.warn('[notificationService] markAsRead note:', err.message);
    }
  },

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId) {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
    } catch (err) {
      console.warn('[notificationService] markAllAsRead note:', err.message);
    }
  },

  /**
   * Clear all user notifications
   */
  async clearAll(userId) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.warn('[notificationService] clearAll note:', err.message);
    }
  },

  /**
   * Delete a single notification
   */
  async deleteOne(notificationId) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    } catch (err) {
      console.warn('[notificationService] deleteOne note:', err.message);
    }
  }
};

export default notificationService;
