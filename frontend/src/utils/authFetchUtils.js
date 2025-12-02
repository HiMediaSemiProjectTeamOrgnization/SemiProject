import axios from 'axios';

// 일반 로그인 비동기 함수
export const authFetchLogin = async (member_data) => {
    try {
        const response = await axios.post('/api/auth/login', member_data);

        return response.status;
    } catch (error) {
        return error.response.status;
    }
};

// 구글 로그인 추가정보 입력 비동기 함수
export const authFetchGoogleSetup = async (member_data) => {
    try {
        const response = await axios.post('/api/auth/google/setup', member_data);

        return response.status;
    } catch (error) {
        return error.response.status;
    }
};

// 구글 추가정보 로그엔 페이지 접근 차단 비동기 함수
export const authFetchGoogleTemp = async () => {
    try {
        const response = await axios.post('/api/auth/google/temp');

        return response.status;
    } catch (error) {
        return error.response.status;
    }
};