export interface SampleMovie {
  id: string;
  title: string;
  year: number;
  duration: string;
  genre: string;
  resolution: string;
  size: string;
  poster: string;
  synopsis: string;
  magnet: string;
  director?: string;
  studio: string;
  featured?: boolean;
}

export const SAMPLE_MOVIES: SampleMovie[] = [
  {
    id: 'sintel',
    title: 'Sintel',
    year: 2010,
    duration: '15 min',
    genre: 'Fantasy · Animation · Adventure',
    resolution: '1080p Full HD',
    size: '129.2 MB',
    poster: '/src/assets/images/movie_poster_sintel_1793486437160.jpg',
    synopsis:
      'A lonely young woman named Sintel nurses an injured baby dragon back to health. When her beloved pet is seized by an adult dragon, she embarks on a relentless and perilous journey across icy mountain ranges to reclaim her companion.',
    magnet:
      'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    director: 'Colin Levy',
    studio: 'Blender Foundation',
    featured: true,
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    year: 2012,
    duration: '12 min',
    genre: 'Sci-Fi · Cyberpunk · VFX',
    resolution: '1080p VFX',
    size: '571.4 MB',
    poster: '/src/assets/images/movie_poster_tears_of_steel_1793486438934.jpg',
    synopsis:
      'Set in a dystopian future where old Amsterdam has been overrun by cybernetic robots, a team of battle-hardened soldiers and rogue scientists reunite at the historic Oude Kerk to project holographic memories of the past in an attempt to stop the cataclysm.',
    magnet:
      'magnet:?xt=urn:btih:2b124f9cfefe123769287c3f076f804a0e14f7ac&dn=Tears+of+Steel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    director: 'Ian Hubert',
    studio: 'Blender Foundation',
    featured: true,
  },
  {
    id: 'cosmos-laundromat',
    title: 'Cosmos Laundromat',
    year: 2015,
    duration: '10 min',
    genre: 'Surreal · Comedy · Sci-Fi',
    resolution: '1080p 60fps',
    size: '211.8 MB',
    poster: '/src/assets/images/movie_poster_cosmos_laundromat_1793486438874.jpg',
    synopsis:
      'On a desolate cliff in the middle of nowhere, a melancholy sheep named Franck meets an enigmatic, fast-talking salesman named Victor, who reveals a cosmic washing machine that offers passage to an infinite sequence of parallel worlds.',
    magnet:
      'magnet:?xt=urn:btih:c9e15763f722f23e98a29decd9b2e8b1a62724b0&dn=Cosmos+Laundromat&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    director: 'Mathieu Auvray',
    studio: 'Blender Animation Studio',
    featured: true,
  },
  {
    id: 'elephants-dream',
    title: 'Elephants Dream',
    year: 2006,
    duration: '11 min',
    genre: 'Steampunk · Surreal · Animation',
    resolution: '1080p HD',
    size: '425.2 MB',
    poster: '/src/assets/images/movie_poster_elephants_dream_1793486438997.jpg',
    synopsis:
      'The groundbreaking film that started open-source computer graphics cinema. Two characters, the elder Proog and youthful Emo, navigate the treacherous and mesmerizing bowels of a gargantuan living machine whose clockwork nature morphs with human imagination.',
    magnet:
      'magnet:?xt=urn:btih:8a7aeb3e582e210d5ac2a403601309f87839e338&dn=Elephants+Dream&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    director: 'Bassam Kurdali',
    studio: 'Orange Open Movie',
    featured: false,
  },
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    year: 2008,
    duration: '10 min',
    genre: 'Cartoon · Comedy · Family',
    resolution: '1080p 30fps',
    size: '276.1 MB',
    poster: '/src/assets/images/hero_cinematic_backdrop_1793486436818.jpg',
    synopsis:
      'A peaceful, giant rabbit with a love for wild berries and butterflies reaches his breaking point when three vicious woodland rodents harass the creatures of the forest, prompting a delightfully clever and comedic woodland retaliation.',
    magnet:
      'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    director: 'Sacha Goedegebure',
    studio: 'Peach Open Movie',
    featured: false,
  },
];
