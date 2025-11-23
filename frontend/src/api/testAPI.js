import axios from 'axios';

// Axios 사용법
/*
const response = await axios.get(`https://jsonplaceholder.typicode.com/posts?q=${keyword}`);
return response.data

'Content-Type': 'application/json', body: JSON.stringify(data)을 안해도 axios에서 자동으로 타입을 변경해준다
axios.get , post, patch, put, delete 등 헤더 타입은 fetch 방식과 동일하다.
await response.json()도 할 필요 없다 promise 객체 처리 및 json 변환을 동시에 axios에서 처리하기 때문이다.
*/

// 기본 URL 설정 (반복되는 주소 줄이기)
const api = axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com'
});

// 게시글 목록 가져오기 (userId가 있으면 필터링, 없으면 전체)
export const fetchPosts = async (userId) => {
    // params로 ?userID=1 과 같은 쿼리스트링 표현
    const response = await api.get('/posts', { // 'https://jsonplaceholder.typicode.com/posts'와 같음
        params: userId ? { userId } : {}
    });
    return response.data;
};