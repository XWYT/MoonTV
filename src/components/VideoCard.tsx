/* eslint-disable @typescript-eslint/no-explicit-any */

import { CheckSquare, Heart, Link, Play } from 'lucide-react'; // 替换 PlayCircle 为更几何的 Play
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteFavorite,
  deletePlayRecord,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { SearchResult } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';

import { ImagePlaceholder } from '@/components/ImagePlaceholder';

// ... (Interface definitions remain same)
interface VideoCardProps {
  id?: string;
  source?: string;
  title?: string;
  query?: string;
  poster?: string;
  episodes?: number;
  source_name?: string;
  progress?: number;
  year?: string;
  from: 'playrecord' | 'favorite' | 'search' | 'douban';
  currentEpisode?: number;
  douban_id?: string;
  onDelete?: () => void;
  rate?: string;
  items?: SearchResult[];
  type?: string;
}

export default function VideoCard({
  id,
  title = '',
  query = '',
  poster = '',
  episodes,
  source,
  source_name,
  progress = 0,
  year,
  from,
  currentEpisode,
  douban_id,
  onDelete,
  rate,
  items,
  type = '',
}: VideoCardProps) {
  // ... (Hooks and logic logic remain exact same, omitted for brevity but should be kept)
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isAggregate = from === 'search' && !!items?.length;

  // ... (Calculation logic omitted, assume same as original)
  const aggregateData = useMemo(() => {
     if (!isAggregate || !items) return null;
    const countMap = new Map<string | number, number>();
    const episodeCountMap = new Map<number, number>();
    items.forEach((item) => {
      if (item.douban_id && item.douban_id !== 0) {
        countMap.set(item.douban_id, (countMap.get(item.douban_id) || 0) + 1);
      }
      const len = item.episodes?.length || 0;
      if (len > 0) {
        episodeCountMap.set(len, (episodeCountMap.get(len) || 0) + 1);
      }
    });
    const getMostFrequent = <T extends string | number>(map: Map<T, number>) => {
      let maxCount = 0;
      let result: T | undefined;
      map.forEach((cnt, key) => {
        if (cnt > maxCount) { maxCount = cnt; result = key; }
      });
      return result;
    };
    return {
      first: items[0],
      mostFrequentDoubanId: getMostFrequent(countMap),
      mostFrequentEpisodes: getMostFrequent(episodeCountMap) || 0,
    };
  }, [isAggregate, items]);

  const actualTitle = aggregateData?.first.title ?? title;
  const actualPoster = aggregateData?.first.poster ?? poster;
  const actualSource = aggregateData?.first.source ?? source;
  const actualId = aggregateData?.first.id ?? id;
  const actualDoubanId = String(aggregateData?.mostFrequentDoubanId ?? douban_id);
  const actualEpisodes = aggregateData?.mostFrequentEpisodes ?? episodes;
  const actualYear = aggregateData?.first.year ?? year;
  const actualQuery = query || '';
  const actualSearchType = isAggregate ? (aggregateData?.first.episodes?.length === 1 ? 'movie' : 'tv') : type;

  useEffect(() => {
    if (from === 'douban' || !actualSource || !actualId) return;
    const fetchFavoriteStatus = async () => {
      try {
        const fav = await isFavorited(actualSource, actualId);
        setFavorited(fav);
      } catch (err) { throw new Error('检查收藏状态失败'); }
    };
    fetchFavoriteStatus();
    const storageKey = generateStorageKey(actualSource, actualId);
    const unsubscribe = subscribeToDataUpdates('favoritesUpdated', (newFavorites: Record<string, any>) => {
      const isNowFavorited = !!newFavorites[storageKey];
      setFavorited(isNowFavorited);
    });
    return unsubscribe;
  }, [from, actualSource, actualId]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (from === 'douban' || !actualSource || !actualId) return;
    try {
      if (favorited) {
        await deleteFavorite(actualSource, actualId);
        setFavorited(false);
      } else {
        await saveFavorite(actualSource, actualId, {
          title: actualTitle,
          source_name: source_name || '',
          year: actualYear || '',
          cover: actualPoster,
          total_episodes: actualEpisodes ?? 1,
          save_time: Date.now(),
        });
        setFavorited(true);
      }
    } catch (err) { throw new Error('切换收藏状态失败'); }
  }, [from, actualSource, actualId, actualTitle, source_name, actualYear, actualPoster, actualEpisodes, favorited]);

  const handleDeleteRecord = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (from !== 'playrecord' || !actualSource || !actualId) return;
    try {
      await deletePlayRecord(actualSource, actualId);
      onDelete?.();
    } catch (err) { throw new Error('删除播放记录失败'); }
  }, [from, actualSource, actualId, onDelete]);

  const handleClick = useCallback(() => {
     if (from === 'douban') {
      router.push(`/play?title=${encodeURIComponent(actualTitle.trim())}${actualYear ? `&year=${actualYear}` : ''}${actualSearchType ? `&stype=${actualSearchType}` : ''}`);
    } else if (actualSource && actualId) {
      router.push(`/play?source=${actualSource}&id=${actualId}&title=${encodeURIComponent(actualTitle)}${actualYear ? `&year=${actualYear}` : ''}${isAggregate ? '&prefer=true' : ''}${actualQuery ? `&stitle=${encodeURIComponent(actualQuery.trim())}` : ''}${actualSearchType ? `&stype=${actualSearchType}` : ''}`);
    }
  }, [from, actualSource, actualId, router, actualTitle, actualYear, isAggregate, actualQuery, actualSearchType]);

  const config = useMemo(() => {
     const configs = {
      playrecord: { showSourceName: true, showProgress: true, showPlayButton: true, showHeart: true, showCheckCircle: true, showDoubanLink: false, showRating: false },
      favorite: { showSourceName: true, showProgress: false, showPlayButton: true, showHeart: true, showCheckCircle: false, showDoubanLink: false, showRating: false },
      search: { showSourceName: true, showProgress: false, showPlayButton: true, showHeart: !isAggregate, showCheckCircle: false, showDoubanLink: !!actualDoubanId, showRating: false },
      douban: { showSourceName: false, showProgress: false, showPlayButton: true, showHeart: false, showCheckCircle: false, showDoubanLink: true, showRating: !!rate },
    };
    return configs[from] || configs.search;
  }, [from, isAggregate, actualDoubanId, rate]);

  return (
    // 修改：外层容器去圆角，增加边框，动画改为 mechanic (快速线性)
    <div
      className='group relative w-full bg-retro-surface cursor-pointer border-2 border-transparent hover:border-retro-text transition-colors duration-mechanic ease-mechanic hover:z-[500]'
      onClick={handleClick}
    >
      {/* 海报容器：去圆角 */}
      <div className='relative aspect-[2/3] overflow-hidden bg-retro-dim'>
        {!isLoading && <ImagePlaceholder aspectRatio='aspect-[2/3]' />}
        <Image
          src={processImageUrl(actualPoster)}
          alt={actualTitle}
          fill
          className='object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-mechanic grayscale group-hover:grayscale-0' // 默认黑白，悬停彩色
          referrerPolicy='no-referrer'
          onLoadingComplete={() => setIsLoading(true)}
        />

        {/* 悬浮遮罩：改为网格或扫描线，而非渐变 */}
        <div className='absolute inset-0 bg-retro-bg/50 opacity-0 group-hover:opacity-0 transition-opacity duration-mechanic' />

        {/* 播放按钮：居中，硬朗风格 */}
        {config.showPlayButton && (
          <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-mechanic'>
            <div className="bg-retro-bg border-2 border-retro-text p-2">
                <Play size={40} className='text-retro-text fill-retro-text' />
            </div>
          </div>
        )}

        {/* 右上角标签：去圆角，高对比 */}
        {config.showRating && rate && (
          <div className='absolute top-0 right-0 bg-retro-text text-black text-xs font-bold w-auto px-2 py-1 border-b-2 border-l-2 border-black'>
            RATING: {rate}
          </div>
        )}

        {actualEpisodes && actualEpisodes > 1 && (
          <div className='absolute top-0 left-0 bg-retro-primary-600 text-white text-xs font-mono px-2 py-1 border-b-2 border-r-2 border-black'>
            EP.{currentEpisode ? `${currentEpisode}/${actualEpisodes}` : actualEpisodes}
          </div>
        )}

        {/* 底部操作栏 */}
        <div className="absolute bottom-0 right-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-mechanic bg-black/80 w-full justify-end border-t border-retro-text">
            {config.showCheckCircle && (
                <CheckSquare onClick={handleDeleteRecord} size={18} className="text-retro-text hover:text-white cursor-pointer" />
            )}
            {config.showHeart && (
                <Heart onClick={handleToggleFavorite} size={18} className={favorited ? "fill-retro-text text-retro-text" : "text-retro-text hover:fill-retro-text"} />
            )}
             {config.showDoubanLink && actualDoubanId && (
                <a href={`https://movie.douban.com/subject/${actualDoubanId}`} target='_blank' rel='noopener noreferrer' onClick={(e) => e.stopPropagation()}>
                    <Link size={18} className="text-retro-text hover:text-white" />
                </a>
            )}
        </div>
      </div>

      {/* 进度条：机械风格，无圆角 */}
      {config.showProgress && progress !== undefined && (
        <div className='h-2 w-full bg-retro-dim border-t border-b border-black relative'>
          <div
            className='h-full bg-retro-text'
            style={{ width: `${progress}%` }}
          />
           {/* 刻度线装饰 */}
           <div className="absolute top-0 right-0 w-[1px] h-full bg-black/50" />
        </div>
      )}

      {/* 标题部分 */}
      <div className='p-2 text-left bg-retro-surface border-t border-retro-border'>
        <div className='relative'>
          <span className='block text-sm font-bold truncate text-retro-dim group-hover:text-retro-text transition-colors duration-mechanic font-mono uppercase'>
            {"> "}{actualTitle}
          </span>
        </div>
        {config.showSourceName && source_name && (
          <div className='flex justify-between items-center mt-1'>
            <span className='text-[10px] text-gray-500 uppercase tracking-widest'>
              [{source_name}]
            </span>
            <span className="text-[10px] text-retro-text opacity-0 group-hover:opacity-100">
                {actualYear}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
