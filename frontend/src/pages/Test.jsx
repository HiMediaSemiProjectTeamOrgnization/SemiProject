import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '../api/testAPI.js';
import { useTestStore } from '../stores/useTestStore.js';
import CommonButton from '../components/CommonButton.jsx';

// React Query 사용법
/*
const { data: posts, isLoading, isError } = useQuery({
  queryKey: ['posts', keyword],
  queryFn: () => fetchPosts(keyword),
  staleTime: 1000 * 60, // 1분
  refetchInterval: 3000, // 3초
});

useQuery는 React Query 선언 함수
queryKey는 배열로 캐싱할 이름 선정
queryFn은 비동기 통신으로 데이터를 가져올 함수 지정
staleTime은 비동기 유지 기간, 지정된 시간을 지남 + 렌더링이 새로 되야만 비동기 새롭게 요청
refetchInterval은 특정 시간 이상 지나면 무조건 자동 갱신(자동 비동기 요청)

data는 비동기 통신후 받아온 데이터
isLoading은 비동기 통신 동안 대기 시간
isError는 에러 발생시
error는 에러 주로 error.message로 활용
*/

const Test = () => {
    const { selectedUserId, setSelectedUserId } = useTestStore();

    const { data: posts, isLoading, isError, error } = useQuery({
        queryKey: ['posts', selectedUserId],
        queryFn: () => fetchPosts(selectedUserId),
        staleTime: 1000 * 60
    });

    if (isLoading) return <div>로딩 중 입니다...</div>
    if (isError) return <div>에러 발생! {error.message}</div>

    return (
        <div>
            <div>
                <CommonButton variant="primary" size="large" onClick={() => setSelectedUserId(null)}>전체 보기</CommonButton>
                <CommonButton variant="secondary" size="medium" onClick={() => setSelectedUserId(1)}>1번 유저</CommonButton>
                <CommonButton variant="danger" size="small" onClick={() => setSelectedUserId(2)}>2번 유저</CommonButton>
            </div>

            <h3>
                현재 필터: {selectedUserId ? `${selectedUserId}번 유저` : '전체'}
            </h3>

            <ul>
                {posts.map((post) => (
                    <li key={post.id}>
                        <strong>유저 아이디: {post.userId}, 게시글 제목: {post.title}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Test;