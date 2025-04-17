import { Skeleton } from '../ui/Skeleton'

const EventCardSkeleton = () => {
  return (
    <div className='flex flex-col bg-gray-100/50 rounded-xl shadow-md p-6 mx-auto w-full animate-pulse'>
      {/* Image Skeleton */}
      <Skeleton className='relative overflow-hidden rounded-lg mb-4 aspect-[4/3] w-full bg-gray-300' />
      {/* Text Skeletons */}
      <Skeleton className='h-6 w-3/4 mb-1 rounded bg-gray-300' />{' '}
      {/* Title */}
      <div className='flex justify-between items-center py-1 mb-1'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-4 w-16 rounded-md bg-gray-300' />{' '}
          {/* Date */}
          <Skeleton className='h-4 w-16 rounded-md bg-gray-300' />{' '}
          {/* Location */}
        </div>
      </div>
      {/* Date Location Skeletons */}
      <Skeleton className='h-4 w-full mb-2 rounded bg-gray-300' />{' '}
      {/* Description Line 1 */}
      <Skeleton className='h-4 w-5/6 mb-4 rounded bg-gray-300' />{' '}
      {/* Description Line 2 */}
      <Skeleton className='h-4 w-12 rounded bg-gray-300 self-end' />{' '}
      {/* 'Ver más' */}
    </div>
  )
}

export default EventCardSkeleton
