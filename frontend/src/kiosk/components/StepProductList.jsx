import React from 'react';

const StepProductList = ({ products, loading, onSelect }) => {
    if (loading) {
        return (
            <div>
                <div></div>
                <p>상품 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div>
            {products.map((p) => (
                <button
                    key={p.product_id}
                    onClick={() => onSelect(p)}
                >
                    <p>{p.name}</p>
                    <span>
                        {Number(p.price).toLocaleString()}원
                    </span>
                </button>
            ))}
        </div>
    );
};

export default StepProductList;
