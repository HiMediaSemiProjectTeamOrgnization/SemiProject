import authClient from './authClient.js';

export const authApi = {
    // 로그인
    login: async (member_data) => {
        return await authClient.post('/auth/login', member_data);
    },
    // 핀코드 입력 모달
    updatePinCode: async (member_data) => {
        return await authClient.post('/auth/login/update-pincode', member_data)
    },
    // 로그아웃
    logout: async () => {
        return await authClient.post('/auth/logout');
    },
    // 회원 가입
    signup: async (member_data) => {
        return await authClient.post('/auth/signup', member_data);
    },
    // 회원 가입 중 아이디 중복 체크
    checkId: async (login_id) => {
        return await authClient.post('/auth/signup/check-id', login_id)
    },
    // 회원 가입 중 휴대폰 중복 체크
    checkPhone: async (phone) => {
        return await authClient.post('/auth/signup/check-phone', phone)
    },
    // 회원 가입 중 휴대폰 중복 체크
    checkVerifyPhone: async (input_code) => {
        return await authClient.post('/auth/signup/check-verify-phone', input_code)
    },
    // 추가 정보 기재 페이지
    onBoarding: async (member_data) => {
        return await authClient.post('/auth/google/onboarding', member_data);
    },
    // 추가 정보 기재 페이지, 비정상적인 접근 차단
    onBoardingInvalidAccess: async () => {
        return await authClient.post('/auth/google/onboarding/invalid-access');
    },
    // 아이디 찾기
    accountRecoveryId: async (id_recovery_data) => {
        return await authClient.post('/auth/account-recovery/id', id_recovery_data);
    },
    // 비밀번호 찾기
    accountRecoveryPw: async (pw_recovery_data) => {
        return await authClient.post('/auth/account-recovery/pw', pw_recovery_data);
    },
    // 아이디 / 비밀번호 입력코드 검증
    accountRecoveryCode: async (input_code) => {
        return await authClient.post('/auth/account-recovery/code', input_code);
    },
};