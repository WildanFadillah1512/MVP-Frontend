import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
  const token = sessionStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const erpApi = {
  getStatus: async () => {
    const res = await axios.get(`${API_URL}/erp/status`, { headers: getAuthHeader() });
    return res.data;
  },
  unlockModule: async (module: string) => {
    const res = await axios.post(`${API_URL}/erp/unlock/${module}`, {}, { headers: getAuthHeader() });
    return res.data;
  },
  getFinanceLedger: async () => {
    const res = await axios.get(`${API_URL}/erp/finance/ledger`, { headers: getAuthHeader() });
    return res.data;
  },
  getCustomers: async () => {
    const res = await axios.get(`${API_URL}/erp/crm/customers`, { headers: getAuthHeader() });
    return res.data;
  }
};

