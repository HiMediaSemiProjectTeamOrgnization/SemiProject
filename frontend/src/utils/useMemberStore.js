import { create } from 'zustand';
import axios from 'axios';

// Zustand (전역 상태 관리 함수) 사용법
/*
create는 Zustand 선언 함수
set은 상태 변경 함수, 안에 콜백 함수도 넣는게 가능하다.
state는 현재 스토어 전체 상태를 의미한다. state.count면 이 함수에서 count를 가져온다. (useState의 (prev => prev + 1)과 비슷함)

// 카운트 스토어
const useCountStore = create((set) => ({
  count: 0,
  setCount: () => set((state) => ({ count: state.count + 1 })),
  setResetCount: () => set({ count: 0 })
}));

// 키워드 스토어
const useSearchStroe = create((set) => ({
  keyword: '',
  setKeyword: (text) => set({ keyword: text })
}));

// 비동기 스토어
const usePostStore = create((set) => ({
  posts: [],
  isLoading: false,
  error: null,
  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/posts');
      set({ posts: res.data });
    } catch (err) {
      set({ error: err });
    } finally {
      set({ isLoading: false });
    }
  }
}));
*/

export const useMemberStore = create((set) => ({
    member: null,
    isLoading: false,
    error: null,
    fetchMember: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get('/api/auth/cookies');
            set({ members: response.data });
        } catch (error) {
            set({ error: error });
        } finally {
            set({ isLoading: false });
        }
    }
}));