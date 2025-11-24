from http.client import responses
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter(prefix="/test", tags=["test"])

TEST_URL = "https://jsonplaceholder.typicode.com/posts"

@router.get("/posts")
async def get_posts():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(TEST_URL)
            response.raise_for_status()

            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code)
        except Exception as e:
            raise HTTPException(status_code=500)

@router.get("/posts/{post_id}")
async def get_post_detail(post_id: int):
    target_url =  f"{TEST_URL}/{post_id}"

    async with httpx.AsyncClient() as client:
        response = await client.get(target_url)
        if response.status_code == 404:
            return {"message": "error"}

        return response.json()