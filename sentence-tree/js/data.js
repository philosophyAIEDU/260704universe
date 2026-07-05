// 레벨별 예문과 성분별 색상 맵

// 성분별 고정 색상 (주어=파랑, 서술어=빨강, 목적어=초록,
// 부사어=주황, 관형어=보라, 보어=청록, 기타=회색)
export const ROLE_COLORS = {
  sentence: '#334155',
  subject: '#2563eb',
  predicate: '#dc2626',
  object: '#16a34a',
  complement: '#0d9488',
  adverbial: '#ea580c',
  determiner: '#7c3aed',
  other: '#64748b',
};

// 단계별 펼치기 순서: 주어 → 서술어 → 목적어 → 나머지
export const REVEAL_ORDER = ['subject', 'predicate', 'object', 'complement', 'adverbial', 'determiner', 'other'];

// 범례에 표시할 성분 목록
export const LEGEND_ROLES = ['subject', 'predicate', 'object', 'complement', 'adverbial', 'determiner'];

// 분석 언어 × 레벨별 예문 5개씩
export const EXAMPLES = {
  ko: {
    beginner: [
      '새가 난다.',
      '꽃이 예쁘다.',
      '아기가 웃는다.',
      '물이 차갑다.',
      '해가 뜬다.',
    ],
    intermediate: [
      '나는 사과를 먹는다.',
      '동생이 학교에서 공부를 한다.',
      '친구가 나에게 선물을 주었다.',
      '우리는 공원에서 축구를 한다.',
      '고양이가 물을 마신다.',
    ],
    advanced: [
      '예쁜 꽃이 정원에 피었다.',
      '그는 훌륭한 의사가 되었다.',
      '부지런한 학생이 도서관에서 책을 읽는다.',
      '작은 새가 높은 나무에서 노래한다.',
      '우리 가족은 주말에 할머니의 집을 방문했다.',
    ],
  },
  en: {
    // 초급: 1형식(주어+동사), 2형식(주어+be동사+보어) — 영어의 뼈대
    beginner: [
      'Birds fly.',
      'The dog runs.',
      'She smiles.',
      'The sun rises.',
      'The baby sleeps.',
      'The bird sings.',
      'The cat jumps.',
      'He swims.',
      'We dance.',
      'They laugh.',
      'We walk together.',
      'The stars shine.',
      'I am happy.',
      'You are kind.',
      'She is a doctor.',
      'I am a student.',
      'The sky is blue.',
      'The soup is hot.',
      'They are friends.',
      'He is tall.',
    ],
    // 중급: 3형식(주어+동사+목적어), 4형식(누구에게+무엇을), 부사·전치사구
    intermediate: [
      'I eat an apple.',
      'She reads a book at home.',
      'They play soccer in the park.',
      'He gives me a present.',
      'We study English every day.',
      'I drink milk in the morning.',
      'She writes a letter to her friend.',
      'He teaches us math.',
      'We watch a movie on Sundays.',
      'I meet my friends after school.',
      'She buys bread at the store.',
      'He opens the window every morning.',
      'They clean the room together.',
      'I make cookies with my mother.',
      'She sings a song for us.',
      'We learn English at school.',
      'He helps his brother every evening.',
      'They build a house near the river.',
      'She tells me a funny story.',
      'I wash my hands before dinner.',
    ],
    // 고급: 형용사 수식어 + 3·4형식 + 전치사구·부사 확장, become(보어)
    advanced: [
      'The diligent student reads a difficult book in the library.',
      'My little sister became a famous singer.',
      'The small bird sings beautifully in the tall tree.',
      'Our family visited grandmother\'s old house last weekend.',
      'A kind teacher explains the new lesson clearly.',
      'The old man tells interesting stories to the children.',
      'My best friend gave me a beautiful present yesterday.',
      'The young artist draws wonderful pictures every morning.',
      'Her older brother became a brave firefighter.',
      'The happy children play fun games after school.',
      'A clever fox found fresh food in the deep forest.',
      'The tall boy writes long letters to his old friend.',
      'My wise grandmother cooks delicious food on holidays.',
      'The busy teacher helps weak students after class.',
      'The white cat drinks warm milk in the quiet kitchen.',
      'Our new neighbor builds a small garden behind the house.',
      'The little girl draws a pretty flower on the white paper.',
      'The strong player kicks the ball very hard.',
      'The gentle nurse gives warm soup to the old patient.',
      'The smart students learn new words very quickly.',
    ],
  },
};
