// Local demonstration assets only; these are not records in the wallpaper database.
// Unsplash photos are used to compare interface concepts, not as a production library.
export const previewWallpapers = [
  {
    id: 'aurora',
    title: '极光来信',
    tag: '星空',
    color: '#a78bfa',
    photo: '1531366936337-7c912a4589a7',
  },
  {
    id: 'lake',
    title: '山湖之间',
    tag: '山野',
    color: '#a6c6e1',
    photo: '1470770841072-f978cf4d019e',
  },
  {
    id: 'night',
    title: '星云深处',
    tag: '星空',
    color: '#da8db8',
    photo: '1462331940025-496dfbfc7564',
  },
  {
    id: 'desert',
    title: '沙丘余温',
    tag: '旷野',
    color: '#e8b583',
    photo: '1509316785289-025f5b846b35',
  },
  {
    id: 'ocean',
    title: '潮汐',
    tag: '海岸',
    color: '#6acbc6',
    photo: '1518837695005-2083093ee35b',
  },
  {
    id: 'peak',
    title: '雪山之巅',
    tag: '山野',
    color: '#bac8d1',
    photo: '1464822759023-fed622ff2c3b',
  },
  {
    id: 'forest',
    title: '森林呼吸',
    tag: '森林',
    color: '#a0c7a6',
    photo: '1448375240586-882707db888b',
  },
  {
    id: 'coast',
    title: '雪夜',
    tag: '星空',
    color: '#afbbe3',
    photo: '1519681393784-d120267933ba',
  },
  {
    id: 'mist',
    title: '林间访客',
    tag: '森林',
    color: '#b3c69d',
    photo: '1472396961693-142e6e269027',
  },
].map((item) => ({
  ...item,
  src: `/preview-assets/${item.id}.jpg`,
  source: `https://images.unsplash.com/photo-${item.photo}`,
}))
