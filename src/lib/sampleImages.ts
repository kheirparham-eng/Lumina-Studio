export interface SamplePhoto {
  id: string;
  title: string;
  category: string;
  url: string;
  credit: string;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sample-landscape',
    title: 'Alpine Mountains',
    category: 'Landscape',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85',
    credit: 'Unsplash - Golden hour over reflecting lake',
  },
  {
    id: 'sample-portrait',
    title: 'Moody Portrait',
    category: 'Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=2400&q=85',
    credit: 'Unsplash - Natural sunlight portrait',
  },
  {
    id: 'sample-urban',
    title: 'Tokyo Neon Street',
    category: 'Urban / Night',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2400&q=85',
    credit: 'Unsplash - Neon lights in alley',
  },
  {
    id: 'sample-architecture',
    title: 'Modern Architecture',
    category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2400&q=85',
    credit: 'Unsplash - Clean geometric shadows',
  },
  {
    id: 'sample-nature',
    title: 'Misty Forest Coast',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=85',
    credit: 'Unsplash - Atmospheric redwood forest',
  },
];
