import { CardData } from './types';

export const HAND_CARDS: CardData[] = [
    { 
        id: "1", 
        type: "ATTACK", 
        name: "Strike",
        description: "Basic attack",
        cost: 3, 
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz0KG07Lruyfwcs0CylpCBzQELmDZ8708K4g8nRHRvtmNEJDol2TBIf1UXTI9hVtxik0ghc8TWVgOvBG_KrvOOzfxdmKx2jVqOTnFAbplSVsVvmBQc2JaEDy3yVqBnZKW_uTGD6k1fV3e6YH9wnLe5B6QKGutNPrRd76IKEyqztPw5hRp3M3wdh7SBmgG0ACCRZfvTFTdOvLJebq0Ya0UIj5OZBkOcUSWo8H3xesJAB3Z4pUtuoNjQ9ZoQ97rYP-M5cVjPAfFLkwI", 
        rot: "-rotate-12", 
        ty: "translate-y-6" 
    },
    { 
        id: "2", 
        type: "DEFENSE", 
        name: "Defend",
        description: "Basic defense",
        cost: 2, 
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCroE4sS8jthKtiw7SbOcVB7m-XJ9F3ztM3cQBZN-P64TNZdLXsRTab7aiBwwyjkTBMfr1Mi6DOsWd5_k1_m7XhaDLppSi732GALkqjJXtwDAry8OzPM84NL3-R1i6jFXVXnX9AeMBqGI3pVpY8ri31x0rXOSP0YnI92BuyOgrldGuo_qZeJTMR5CpHiDBNzqerWyQ95n-v8NiazgHIYAFf4niy5_iTy_FfOeqnM8jhrfw0kNZkEHR1YRObCJmPzslp4JMrNTC-Kdk", 
        rot: "-rotate-6", 
        ty: "translate-y-3" 
    },
    { 
        id: "3", 
        type: "IMPACT", 
        name: "Semme",
        description: "Special impact",
        cost: 2, 
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw80oIeHzQfRuaHPRmW8hbhRaMwZc2_qLwyOKXD38HscRqtNsr2FFeOxuS0ls2PA7VJA9yEFL59caHnxxF2VS5nyo9hBLv6e38RF6UwvtNjkLLsY5pMB5WKoYKHPidC5hrRBo32Qxpn-SM-dUViy2G9jIQHkTiXvX0XPLht13PqAoQhA-bg9Z-NaaM1R2XwtOAIkVrWsJGhnGQkFHBJDB_QeftHPxZUV7ajSr3h_KBEc_iIVnV3km9MnCsxRgP8FOrZY7zk6QljBI", 
        rot: "rotate-0", 
        ty: "translate-y-0",
        rank: 1 
    },
    { 
        id: "4", 
        type: "ATTACK", 
        name: "Draw",
        description: "Draw card",
        cost: 0, 
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCBFYBLHiRrgZs5iszz0CQtJgBWsE0tc46D2C8eSSeEmO52AcdWW3U2cDPGF75FnL9mmLPcuutKog_l6hVzPqv2Gs5zkR5uH03NcXKSbqPBAIF46pqOynyxPzWuSKSF-9gcscHGycbAVVIk8jumBWhSQY2C4x2kBsxT3MfUnqwadf6TAAe4Yysnlz5Jzgxnea7PbIL5BIHH8hcxyFb3ogkKtfaTwnLIE6U3yye7-zgCNs5l6tmV0z93br5s4-YbFaGZgKRRD7VVHY", 
        rot: "rotate-6", 
        ty: "translate-y-3" 
    },
    { 
        id: "5", 
        type: "IMPACT", 
        name: "Artifact",
        description: "Ancient artifact",
        cost: 2, 
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBK3qFVj17TqLkBVp3uifYGgSZpXXDqBbSUBu2gVYX0tB2eTc2ezffQzy3B3W35EOtNH54INu6BDeyIqEnlRqvn3CG17RR3sQApn6DZlhuAV3DhG6DVgSrHbxO02eH0F1Sy7Kp5Vcyzawcx1ExsREhwEDJm4xI-6W5OOzyYa12sHmJcOK2lI5Fi0QPsfsQgjiLT5UetwyBjfQVnXRStJ6RAhZSXMCc1fGNv-CofBoMFF8uJXwn3zwWYpbR72y2BQcbpqazE5FZEHm8", 
        rot: "rotate-12", 
        ty: "translate-y-6",
        rank: 1
    }
];

export const CORNER_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuDLYjIvF3w-VpTTlVS_chZzFr0IRsJnAvYjmaUIMzNwLSkzqCK-CXVnIxhIY0OZ9ChUitP_Dydn8QaOV_5xsZaLOORFu79SihveZDqq6fECjnSTnCWPUgcJnbmZjbhUpV_KaZLS6FAvc6iyQmmNyoCSYhaAsT_gV1eVXpNPBGg3y7lzvf6i_lW0EzWigLY5nzwsDooDs2H5Be4GQzx0xP7tKOlpCFghLlySkXCdC0--W2mrQR7PL6tfuLVYzepU1KPFX6kRcn2Pvig";
// Updated with the specific image ID from the provided Imgur gallery link
export const SOVEREIGN_IMG = "https://i.imgur.com/ktYckGj.jpeg";
export const OPPONENT_IMG = "https://i.imgur.com/UQwzvBK.jpeg";
export const PLAYER_IMG = "https://i.imgur.com/Lbr74t5_d.webp?maxwidth=760&fidelity=grand"; // Unified the player avatar
export const VICTORY_IMG = SOVEREIGN_IMG; // Unified the victory avatar
export const BACKGROUND_ORNAMENT = "https://img.freepik.com/free-vector/luxury-ornamental-design-element_1159-5485.jpg?w=1380";
export const BATTLE_BG_IMG = "https://i.imgur.com/uk6XG6c.jpeg"; // Dark ruins background