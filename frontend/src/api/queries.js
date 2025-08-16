
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function getDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard`);
    return await response.json();
  } catch (error) {
    return [];
  }
}

export async function getStudentDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/studentinfo`);
    return await response.json();
  } catch (error) {
    return [];
  }
}

export async function getUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/getstudent`);
    return await response.json();
  } catch (error) {
    return [];
  }
}
