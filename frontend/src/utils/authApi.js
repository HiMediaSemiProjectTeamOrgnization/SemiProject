import authClient from './authClient.js';

export const authApi = {
    // 일반 로그인
    login: async (member_data) => {
        return await authClient.post('/auth/login', member_data);
    },
    // 추가 정보 기재 페이지
    onBoarding: async (member_data) => {
        return await authClient.post('/auth/google/onboarding', member_data);
    },
    // 추가 정보 기재 페이지, 비정상적인 접근 차단
    onBoardingInvalidAccess: async () => {
        return await authClient.post('/auth/google/onboarding/invalid-access');
    }
};