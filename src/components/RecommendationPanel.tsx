import React, { useEffect, useState } from 'react';

interface Movie {
  id: number;
  title: string;
  rating: number; // 豆瓣评分
  releaseDate: string; // 上映时间
  genre: string;
}

// 模拟数据，实际项目中可通过接口获取
const dummyMovies: Movie[] = [
  {
    id: 1,
    title: '电影A',
    rating: 8.5,
    releaseDate: '2022-05-10',
    genre: '动作',
  },
  {
    id: 2,
    title: '电影B',
    rating: 9.0,
    releaseDate: '2023-01-20',
    genre: '爱情',
  },
  {
    id: 3,
    title: '电影C',
    rating: 7.8,
    releaseDate: '2021-11-01',
    genre: '喜剧',
  },
];

const RecommendationPanel: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 模拟获取用户最近观看的影片类型，默认使用 '动作'
    const userPreferenceGenre = localStorage.getItem('recentGenre') || '动作';
    const filteredMovies = dummyMovies.filter(
      (movie) => movie.genre === userPreferenceGenre
    );
    // 根据评分和上映时间排序（评分降序，相同评分则按照上映时间降序）
    filteredMovies.sort((a, b) => {
      if (b.rating === a.rating) {
        return (
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      }
      return b.rating - a.rating;
    });
    setMovies(filteredMovies);
    setLoading(false);
  }, []);

  return (
    <div className='p-4 bg-white shadow rounded mt-6'>
      <h2 className='text-xl font-bold mb-4'>推荐影片</h2>
      {loading ? (
        <div>加载中...</div>
      ) : movies.length === 0 ? (
        <div>暂无推荐影片</div>
      ) : (
        <ul className='space-y-3'>
          {movies.map((movie) => (
            <li
              key={movie.id}
              className='border p-3 rounded hover:shadow transition'
            >
              <div className='flex justify-between items-center'>
                <span className='font-semibold'>{movie.title}</span>
                <span className='text-sm text-gray-600'>
                  评分: {movie.rating}
                </span>
              </div>
              <div className='text-sm text-gray-500'>
                上映时间: {movie.releaseDate}
              </div>
              <div className='text-sm text-gray-500'>类型: {movie.genre}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecommendationPanel;
