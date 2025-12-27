import apiClient from '../utils/api';

export const attendanceService = {
  // Get all attendance records
  getAll: async (params = {}) => {
    return await apiClient.get('/attendance', { params });
  },

  // Get today's attendance
  getTodayAttendance: async (params = {}) => {
    return await apiClient.get('/attendance/today', { params });
  },

  // Get employee attendance
  getEmployeeAttendance: async (employeeId, month, year) => {
    return await apiClient.get(`/attendance/employee/${employeeId}`, {
      params: { month, year },
    });
  },

  // Clock in
  clockIn: async (data) => {
    return await apiClient.post('/attendance/clock-in', data);
  },

  // Clock out
  clockOut: async (data) => {
    return await apiClient.post('/attendance/clock-out', data);
  },

  // Mark absent
  markAbsent: async (data) => {
    return await apiClient.post('/attendance/mark-absent', data);
  },
};

