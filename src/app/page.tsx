/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console */

'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

// 客户端收藏 API
import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { getDoubanCategories } from '@/lib/douban.client';
import { DoubanItem } from '@/lib/types';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import ContinueWatching from '@/components/ContinueWatching';
import PageLayout from '@/components/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import { useSite } from '@/components/SiteProvider';
import VideoCard from '@/components/VideoCard';

function HomeClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'favorites'>('home');
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([]);
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([]);
  const [hotVarietyShows, setHotVarietyShows] = useState<DoubanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { announcement } = useSite();

  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // 检查公告弹窗状态
  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement');
      if (hasSeenAnnouncement !== announcement) {
        setShowAnnouncement(true);
      } else {
        setShowAnnouncement(Boolean(!hasSeenAnnouncement && announcement));
      }
    }
  }, [announcement]);

  // 收藏夹数据
  type FavoriteItem = {
    id: string;
    source: string;
    title: string;
    poster: string;
    episodes: number;
    source_name: string;
    currentEpisode?: number;
    search_title?: string;
  };

  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const fetchDoubanData = async () => {
      try {
        setLoading(true);

        // 并行获取热门电影、热门剧集和热门综艺
        const [moviesData, tvShowsData, varietyShowsData] = await Promise.all([
          getDoubanCategories({
            kind: 'movie',
            category: '热门',
            type: '全部',
          }),
          getDoubanCategories({ kind: 'tv', category: 'tv', type: 'tv' }),
          getDoubanCategories({ kind: 'tv', category: 'show', type: 'show' }),
        ]);

        if (moviesData.code === 200) {
          setHotMovies(moviesData.list);
        }

        if (tvShowsData.code === 200) {
          setHotTvShows(tvShowsData.list);
        }

        if (varietyShowsData.code === 200) {
          setHotVarietyShows(varietyShowsData.list);
        }
      } catch (error) {
        console.error('获取豆瓣数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoubanData();
  }, []);

  // 处理收藏数据更新的函数
  const updateFavoriteItems = async (allFavorites: Record<string, any>) => {
    const allPlayRecords = await getAllPlayRecords();

    // 根据保存时间排序（从近到远）
    const sorted = Object.entries(allFavorites)
      .sort(([, a], [, b]) => b.save_time - a.save_time)
      .map(([key, fav]) => {
        const plusIndex = key.indexOf('+');
        const source = key.slice(0, plusIndex);
        const id = key.slice(plusIndex + 1);

        // 查找对应的播放记录，获取当前集数
        const playRecord = allPlayRecords[key];
        const currentEpisode = playRecord?.index;

        return {
          id,
          source,
          title: fav.title,
          year: fav.year,
          poster: fav.cover,
          episodes: fav.total_episodes,
          source_name: fav.source_name,
          currentEpisode,
          search_title: fav?.search_title,
        } as FavoriteItem;
      });
    setFavoriteItems(sorted);
  };

  // 当切换到收藏夹时加载收藏数据
  useEffect(() => {
    if (activeTab !== 'favorites') return;

    const loadFavorites = async () => {
      const allFavorites = await getAllFavorites();
      await updateFavoriteItems(allFavorites);
    };

    loadFavorites();

    // 监听收藏更新事件
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, any>) => {
        updateFavoriteItems(newFavorites);
      }
    );

    return unsubscribe;
  }, [activeTab]);

  const handleCloseAnnouncement = (announcement: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', announcement); // 记录已查看弹窗
  };

  return (
    <PageLayout>
      <div className='px-4 sm:px-10 py-6 sm:py-10 overflow-visible'>
        {/* 顶部 Tab 切换 */}
        <div className='mb-10 flex justify-center'>
          <CapsuleSwitch
            options={[
              { label: '首页', value: 'home' },
              { label: '收藏夹', value: 'favorites' },
            ]}
            active={activeTab}
            onChange={(value) => setActiveTab(value as 'home' | 'favorites')}
          />
        </div>

        <div className='max-w-[96%] xl:max-w-[1200px] mx-auto space-y-10'>
          {activeTab === 'favorites' ? (
            // 收藏夹视图
            <section className='surface-panel rounded-[28px] p-5 sm:p-7'>
              <div className='mb-6 flex items-center justify-between'>
                <div>
                  <h2 className='text-2xl font-semibold text-white tracking-tight'>
                    我的收藏
                  </h2>
                  <p className='text-sm text-white/60 mt-1'>
                    保存喜欢的片单，随时继续播放。
                  </p>
                </div>
                {favoriteItems.length > 0 && (
                  <button
                    className='text-sm text-white/70 hover:text-white transition-colors focus-ring rounded-full px-3 py-1'
                    onClick={async () => {
                      await clearAllFavorites();
                      setFavoriteItems([]);
                    }}
                  >
                    清空
                  </button>
                )}
              </div>
              <div className='justify-start grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-[repeat(auto-fill,_minmax(11.5rem,_1fr))] sm:gap-x-8 sm:gap-y-12'>
                {favoriteItems.map((item) => (
                  <div key={item.id + item.source} className='w-full'>
                    <VideoCard
                      query={item.search_title}
                      {...item}
                      from='favorite'
                      type={item.episodes > 1 ? 'tv' : ''}
                    />
                  </div>
                ))}
                {favoriteItems.length === 0 && (
                  <div className='col-span-full text-center text-white/60 py-12'>
                    暂无收藏内容
                  </div>
                )}
              </div>
            </section>
          ) : (
            // 首页视图
            <>
              {/* 继续观看 */}
              <ContinueWatching className='surface-panel rounded-[28px] p-5 sm:p-7' />

              {/* 热门电影 */}
              <section className='surface-panel rounded-[28px] p-5 sm:p-7'>
                <div className='mb-5 flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-semibold text-white'>
                      热门电影
                    </h2>
                    <p className='text-sm text-white/60 mt-1'>
                      本周热度最高的新片与佳作。
                    </p>
                  </div>
                  <Link
                    href='/douban?type=movie'
                    className='flex items-center text-sm text-white/70 hover:text-white focus-ring rounded-full px-2 py-1'
                  >
                    查看更多
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? // 加载状态显示灰色占位数据
                      Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className='min-w-[110px] w-28 sm:min-w-[200px] sm:w-48'
                        >
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-white/5 animate-pulse'>
                            <div className='absolute inset-0 bg-white/10'></div>
                          </div>
                          <div className='mt-3 h-4 bg-white/10 rounded animate-pulse'></div>
                        </div>
                      ))
                    : // 显示真实数据
                      hotMovies.map((movie, index) => (
                        <div
                          key={index}
                          className='min-w-[110px] w-28 sm:min-w-[200px] sm:w-48'
                        >
                          <VideoCard
                            from='douban'
                            title={movie.title}
                            poster={movie.poster}
                            douban_id={movie.id}
                            rate={movie.rate}
                            year={movie.year}
                            type='movie'
                          />
                        </div>
                      ))}
                </ScrollableRow>
              </section>

              {/* 热门剧集 */}
              <section className='surface-panel rounded-[28px] p-5 sm:p-7'>
                <div className='mb-5 flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-semibold text-white'>
                      热门剧集
                    </h2>
                    <p className='text-sm text-white/60 mt-1'>
                      爆款新季与口碑剧集精选。
                    </p>
                  </div>
                  <Link
                    href='/douban?type=tv'
                    className='flex items-center text-sm text-white/70 hover:text-white focus-ring rounded-full px-2 py-1'
                  >
                    查看更多
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? // 加载状态显示灰色占位数据
                      Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className='min-w-[110px] w-28 sm:min-w-[200px] sm:w-48'
                        >
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-white/5 animate-pulse'>
                            <div className='absolute inset-0 bg-white/10'></div>
                          </div>
                          <div className='mt-3 h-4 bg-white/10 rounded animate-pulse'></div>
                        </div>
                      ))
                    : // 显示真实数据
                      hotTvShows.map((show, index) => (
                        <div
                          key={index}
                          className='min-w-[110px] w-28 sm:min-w-[200px] sm:w-48'
                        >
                          <VideoCard
                            from='douban'
                            title={show.title}
                            poster={show.poster}
                            douban_id={show.id}
                            rate={show.rate}
                            year={show.year}
                          />
                        </div>
                      ))}
                </ScrollableRow>
              </section>

              {/* 热门综艺 */}
              <section className='surface-panel rounded-[28px] p-5 sm:p-7'>
                <div className='mb-5 flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-semibold text-white'>
                      热门综艺
                    </h2>
                    <p className='text-sm text-white/60 mt-1'>
                      轻松解压的综艺与热门真人秀。
                    </p>
                  </div>
                  <Link
                    href='/douban?type=show'
                    className='flex items-center text-sm text-white/70 hover:text-white focus-ring rounded-full px-2 py-1'
                  >
                    查看更多
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? // 加载状态显示灰色占位数据
                      Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className='min-w-[110px] w-28 sm:min-w-[200px] sm:w-48'
                        >
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-white/5 animate-pulse'>
                            <div className='absolute inset-0 bg-white/10'></div>
                          </div>
                          <div className='mt-3 h-4 bg-white/10 rounded animate-pulse'></div>
                        </div>
                      ))
                    : // 显示真实数据
                      hotVarietyShows.map((show, index) => (
                        <div
                          key={index}
                          className='min-w-[110px] w-28 sm:min-w-[200px] sm:w-48'
                        >
                          <VideoCard
                            from='douban'
                            title={show.title}
                            poster={show.poster}
                            douban_id={show.id}
                            rate={show.rate}
                            year={show.year}
                          />
                        </div>
                      ))}
                </ScrollableRow>
              </section>
            </>
          )}
        </div>
      </div>
      {announcement && showAnnouncement && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70 p-4 transition-opacity duration-300 ${
            showAnnouncement ? '' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className='w-full max-w-md rounded-[28px] bg-[#141721]/90 backdrop-blur-2xl p-7 shadow-[0_40px_90px_-45px_rgba(0,0,0,0.85)] border border-white/10'>
            <div className='flex justify-between items-start mb-4'>
              <h3 className='text-2xl font-semibold tracking-tight text-white'>
                提示
              </h3>
            </div>
            <div className='mb-6'>
              <div className='relative overflow-hidden rounded-2xl mb-4 bg-white/5 border border-white/10 p-4'>
                <div className='absolute inset-y-0 left-0 w-1.5 bg-primary-500'></div>
                <p className='ml-4 text-white/80 leading-relaxed'>
                  {announcement}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCloseAnnouncement(announcement)}
              className='w-full rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-white font-semibold shadow-[0_20px_40px_-25px_rgba(255,47,95,0.9)] transition-transform duration-300 hover:-translate-y-0.5 focus-ring'
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
