// src-modern/scripts/utils/constants.js

export const CATEGORY_MAP = {
    '671acb0298f2c700f9e2c5a9': 'Món hot',
    '691054a4ad02ab999d92ae84': 'Thịt cá tươi sống',
    '69105618ad02ab999d92aea3': 'Rau ngon',
    '691052e7ad02ab999d92ae66': 'Cơm',
    '69105168ad02ab999d92ae48': 'Bún, phở, mì',
    '690fa786aa5dcb293103a609': 'Bánh ngọt',
    '69104ed7ad02ab999d92ae27': 'Trà sữa, hồng trà',
};

export const CATEGORY_COLORS = {
    'Món hot': '#ff6b6b',
    'Thịt cá tươi sống': '#fa5252',
    'Rau ngon': '#51cf66',
    'Cơm': '#fcc419',
    'Bún, phở, mì': '#ff922b',
    'Bánh ngọt': '#ff8787',
    'Trà sữa, hồng trà': '#a78bfa',
    'default': '#868e96'
};

// ✅ Thêm option để bỏ qua category không hợp lệ
export const getCategoryName = (id, hideInvalid = false) => {
    if (CATEGORY_MAP[id]) {
        return CATEGORY_MAP[id];
    }
    
    // Nếu hideInvalid = true, trả về null để có thể filter
    if (hideInvalid) {
        console.warn(`⚠️ Unknown category ID: ${id}`);
        return null;
    }
    
    return id || 'Khác';
};

export const getCategoryColor = (name) => {
    return CATEGORY_COLORS[name] || CATEGORY_COLORS['default'];
};
