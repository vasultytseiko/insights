export const engagementRateResponseExample = [
  {
    engagementRate: '1.73%',
    month: '2024-01',
  },
  {
    engagementRate: '3.85%',
    month: '2024-02',
  },
  {
    engagementRate: '1.95%',
    month: '2024-03',
  },
  {
    engagementRate: '2.24%',
    month: '2024-04',
  },
  {
    engagementRate: '2.89%',
    month: '2024-05',
  },
  {
    engagementRate: '1.80%',
    month: '2024-06',
  },
];

export const getPostPublishDynamicsExample = {
  mediaPerMonth: [
    {
      media_count: 6,
      monthNumber: '2024-01',
    },
    {
      media_count: 6,
      monthNumber: '2024-02',
    },
    {
      media_count: 6,
      monthNumber: '2024-03',
    },
    {
      media_count: 0,
      monthNumber: '2024-04',
    },
    {
      media_count: 6,
      monthNumber: '2024-05',
    },
    {
      media_count: 0,
      monthNumber: '2024-06',
    },
  ],
  lastDiff: {
    change: -6,
    changePercentage: '-100%',
  },
};

export const getPostTypesExample = {
  total: 24,
  image: {
    name: 'IMAGE',
    count: 8,
    percent: '33.33%',
  },
  carouselAlbum: {
    name: 'CAROUSEL_ALBUM',
    count: 16,
    percent: '66.67%',
  },
  reel: {
    name: 'REELS',
    count: 0,
    percent: '0.00%',
  },
  video: {
    name: 'VIDEO',
    count: 0,
    percent: '0.00%',
  },
  stories: {
    name: 'STORIES',
    count: 0,
    percent: '0.00%',
  },
};
