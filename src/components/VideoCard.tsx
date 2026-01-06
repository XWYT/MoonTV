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
    const getMostFrequent = <T extends string | number>(
      map: Map<T, number>
    ) => {
      let maxCount = 0;
      let result: T | undefined;
      map.forEach((cnt, key) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          result = key;
        }
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
  const actualDoubanId = String(
    aggregateData?.mostFrequentDoubanId ?? douban_id
  );
  const actualEpisodes = aggregateData?.mostFrequentEpisodes ?? episodes;
  const actualYear = aggregateData?.first.year ?? year;
  const actualQuery = query || '';
  const actualSearchType = isAggregate
    ? aggregateData?.first.episodes?.length === 1
      ? 'movie'
      : 'tv'
    : type;

  useEffect(() => {
    if (from === 'douban' || !actualSource || !actualId) return;
    const fetchFavoriteStatus = async () => {
      try {
        const fav = await isFavorited(actualSource, actualId);
        setFavorited(fav);
      } catch (err) {
        throw new Error('检查收藏状态失败');
      }
    };
    fetchFavoriteStatus();
    const storageKey = generateStorageKey(actualSource, actualId);
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, any>) => {
        const isNowFavorited = !!newFavorites[storageKey];
        setFavorited(isNowFavorited);
      }
    );
    return unsubscribe;
  }, [from, actualSource, actualId]);

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
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
      } catch (err) {
        throw new Error('切换收藏状态失败');
      }
    },
    [
      from,
      actualSource,
      actualId,
      actualTitle,
      source_name,
      actualYear,
      actualPoster,
      actualEpisodes,
      favorited,
    ]
  );

  const handleDeleteRecord = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (from !== 'playrecord' || !actualSource || !actualId) return;
      try {
        await deletePlayRecord(actualSource, actualId);
        onDelete?.();
      } catch (err) {
        throw new Error('删除播放记录失败');
      }
    },
    [from, actualSource, actualId, onDelete]
  );

  const handleClick = useCallback(() => {
    if (from === 'douban') {
      router.push(
        `/play?title=${encodeURIComponent(actualTitle.trim())}${
          actualYear ? `&year=${actualYear}` : ''
        }${actualSearchType ? `&stype=${actualSearchType}` : ''}`
      );
    } else if (actualSource && actualId) {
      router.push(
        `/play?source=${actualSource}&id=${actualId}&title=${encodeURIComponent(
          actualTitle
        )}${actualYear ? `&year=${actualYear}` : ''}${
          isAggregate ? '&prefer=true' : ''
        }${
          actualQuery ? `&stitle=${encodeURIComponent(actualQuery.trim())}` : ''
        }${actualSearchType ? `&stype=${actualSearchType}` : ''}`
      );
    }
  }, [
    from,
    actualSource,
    actualId,
    router,
    actualTitle,
    actualYear,
    isAggregate,
    actualQuery,
    actualSearchType,
  ]);

  const config = useMemo(() => {
    const configs = {
      playrecord: {
        showSourceName: true,
        showProgress: true,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: true,
        showDoubanLink: false,
        showRating: false,
      },
      favorite: {
        showSourceName: true,
        showProgress: false,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: false,
        showDoubanLink: false,
        showRating: false,
      },
      search: {
        showSourceName: true,
        showProgress: false,
        showPlayButton: true,
        showHeart: !isAggregate,
        showCheckCircle: false,
        showDoubanLink: !!actualDoubanId,
        showRating: false,
      },
      douban: {
        showSourceName: false,
        showProgress: false,
        showPlayButton: true,
        showHeart: false,
        showCheckCircle: false,
        showDoubanLink: true,
        showRating: !!rate,
      },
    };
    return configs[from] || configs.search;
  }, [from, isAggregate, actualDoubanId, rate]);

  return (
    <div
      className='group relative w-full h-full cursor-pointer overflow-hidden rounded-3xl bg-retro-surface/90 backdrop-blur-2xl border border-retro-border/60 shadow-[0_25px_50px_-30px_rgba(0,0,0,0.75)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_78px_-30px_rgba(0,0,0,0.85)]'
      onClick={handleClick}
    >
      <div className='flex h-full flex-col'>
        <div className='relative aspect-[2/3] overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900/80 via-ink-900/60 to-ink-900'>
          {!isLoading && <ImagePlaceholder aspectRatio='aspect-[2/3]' />}
          <Image
            src={processImageUrl(actualPoster)}
            alt={actualTitle}
            fill
            className='object-cover transition duration-500 ease-out scale-105 group-hover:scale-110 group-hover:saturate-125'
            referrerPolicy='no-referrer'
            onLoadingComplete={() => setIsLoading(true)}
          />

          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent' />

          {config.showPlayButton && (
            <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
              <div className='h-14 w-14 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_20px_40px_-25px_rgba(0,0,0,0.8)]'>
                <Play size={28} className='text-white drop-shadow' />
              </div>
            </div>
          )}

          {config.showRating && rate && (
            <div className='absolute top-3 right-3 rounded-full bg-gradient-to-r from-primary-500/90 to-primary-600/90 text-xs font-semibold text-ink-50 px-3 py-1 shadow-[0_12px_30px_-18px_rgba(229,9,20,0.55)]'>
              {rate} / 10
            </div>
          )}

          {actualEpisodes && actualEpisodes > 1 && (
            <div className='absolute top-3 left-3 rounded-full bg-white/15 backdrop-blur-xl text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-50 px-3 py-1 border border-white/20'>
              EP{' '}
              {currentEpisode
                ? `${currentEpisode}/${actualEpisodes}`
                : actualEpisodes}
            </div>
          )}

          <div className='absolute bottom-0 right-0 left-0 p-3 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <div className='flex items-center gap-3 rounded-full bg-black/35 backdrop-blur-xl px-3 py-2 border border-white/10'>
              {config.showCheckCircle && (
                <CheckSquare
                  onClick={handleDeleteRecord}
                  size={18}
                  className='text-ink-50/80 hover:text-ink-50 transition-colors'
                />
              )}
              {config.showHeart && (
                <Heart
                  onClick={handleToggleFavorite}
                  size={18}
                  className={
                    favorited
                      ? 'fill-primary-500 text-primary-300 drop-shadow'
                      : 'text-ink-50/80 hover:text-primary-200 hover:fill-primary-200'
                  }
                />
              )}
              {config.showDoubanLink && actualDoubanId && (
                <a
                  href={`https://movie.douban.com/subject/${actualDoubanId}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    size={18}
                    className='text-ink-50/80 hover:text-primary-200 transition-colors'
                  />
                </a>
              )}
            </div>
          </div>
        </div>

        {config.showProgress && progress !== undefined && (
          <div className='px-4 pt-3'>
            <div className='h-1.5 w-full bg-ink-800/60 rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className='flex flex-1 flex-col px-4 pb-4 pt-3 gap-3 min-h-[128px]'>
          <div className='flex items-start justify-between gap-2'>
            <span className='block text-sm sm:text-[15px] font-semibold text-ink-50 leading-snug line-clamp-2'>
              {actualTitle}
            </span>
            <span
              className={`text-[11px] text-ink-200/80 rounded-full bg-ink-900/80 px-2 py-1 border border-ink-800/70 leading-none ${
                actualYear ? '' : 'opacity-0'
              }`}
            >
              {actualYear || '0000'}
            </span>
          </div>
          <div className='flex justify-between items-center text-[11px] text-ink-200/80 uppercase tracking-[0.14em]'>
            <span className={source_name ? 'truncate' : 'opacity-0'}>
              {source_name || 'source'}
            </span>
            <span
              className={`px-2 py-1 rounded-full bg-ink-900/70 border border-ink-800/80 text-[10px] tracking-widest ${
                actualSearchType ? '' : 'opacity-0'
              }`}
            >
              {actualSearchType === 'tv'
                ? 'Series'
                : actualSearchType === 'movie'
                ? 'Movie'
                : 'Type'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
