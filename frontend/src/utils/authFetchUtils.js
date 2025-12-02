import axios from 'axios';

export const authFetchLogin = async (member_data) => {
    try {
        const response = await axios.post('/api/auth/login', member_data);

        return response.status;
    } catch (error) {
        return error.response.status;
    }
};