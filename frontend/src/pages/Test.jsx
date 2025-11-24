import { useTestStore } from '../stores/useTestStore.js';
import CommonButton from '../components/CommonButton.jsx';

/*
* useNavigate 사용법
* import { useNavigate } from 'react-router-dom';
* const navigate = useNavigate();
* navigate('/home');
*
* NavLink 사용법
* <NavLink to="/about"
  // isActive가 true면 red, 아니면 black (자동 판별)
  style={({ isActive }) => ({
    color: isActive ? 'red' : 'black',
    fontWeight: isActive ? 'bold' : 'normal'
  })}>
* */
const Test = () => {
    const { posts, isLoading, isError, fetchPosts } = useTestStore();

    if (isLoading) return <div>로딩 중 입니다...</div>
    if (isError) return <div>에러 발생! {isError.message}</div>

    return (
        <div>
            <div>
                <CommonButton variant="primary" size="large" onClick={() => fetchPosts(null)}>전체 보기</CommonButton>
                <CommonButton variant="secondary" size="medium" onClick={() => fetchPosts(1)}>1번 유저</CommonButton>
                <CommonButton variant="danger" size="small" onClick={() => fetchPosts(2)}>2번 유저</CommonButton>
            </div>

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