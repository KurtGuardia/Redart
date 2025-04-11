import { Skeleton } from './ui/Skeleton'

const DashboardSkeleton = () => {
  return (
    <div className='relative container mx-auto my-24'>
      {/* Header Skeleton */}
      <Skeleton className='h-36 rounded-lg shadow-lg p-6 mb-8 bg-gray-300' />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Left Column: Venue Details Skeleton */}
        <div className='bg-white rounded-lg shadow-lg p-6 space-y-6'>
          <div className='flex justify-between items-center'>
            <Skeleton className='h-8 w-1/3 bg-gray-300' />{' '}
            {/* Title */}
            <Skeleton className='h-6 w-6 bg-gray-300 rounded-full' />{' '}
            {/* Edit icon */}
          </div>

          {/* Logo and Name Skeleton */}
          <div className='flex items-center mb-4'>
            <Skeleton className='w-20 h-20 rounded-full bg-gray-300 mr-4' />
            <Skeleton className='h-7 w-2/5 bg-gray-300' />
          </div>

          {/* Map Skeleton */}
          <Skeleton className='h-64 w-full rounded-lg bg-gray-300' />

          {/* Info Sections Skeleton */}
          <div className='bg-gray-100 p-4 rounded-lg space-y-2'>
            <Skeleton className='h-5 w-1/4 bg-gray-300' />{' '}
            {/* Section Title */}
            <Skeleton className='h-4 w-full bg-gray-300' />
            <Skeleton className='h-4 w-3/4 bg-gray-300' />
          </div>
          <div className='bg-gray-100 p-4 rounded-lg space-y-2'>
            <Skeleton className='h-5 w-1/4 bg-gray-300' />{' '}
            {/* Section Title */}
            <Skeleton className='h-4 w-full bg-gray-300' />
            <Skeleton className='h-4 w-full bg-gray-300' />
            <Skeleton className='h-4 w-5/6 bg-gray-300' />
          </div>
          <div className='bg-gray-100 p-4 rounded-lg space-y-2'>
            <Skeleton className='h-5 w-1/4 bg-gray-300' />{' '}
            {/* Section Title */}
            <Skeleton className='h-4 w-1/2 bg-gray-300' />
          </div>
          {/* Photos Skeleton */}
          <div className='mt-4 space-y-2'>
            <Skeleton className='h-5 w-1/4 bg-gray-300 mb-2' />{' '}
            {/* Title */}
            <div className='grid grid-cols-3 gap-2'>
              <Skeleton className='h-36 w-full bg-gray-300 rounded-lg' />
              <Skeleton className='h-36 w-full bg-gray-300 rounded-lg' />
              <Skeleton className='h-36 w-full bg-gray-300 rounded-lg' />
            </div>
          </div>
          <div className='mt-32 text-center'>
            <Skeleton className='h-10 w-1/2 mx-auto bg-gray-300 rounded-lg' />{' '}
            {/* Link */}
          </div>
        </div>

        {/* Right Column: Events Skeleton */}
        <div className='bg-white rounded-lg shadow-lg p-6 space-y-6'>
          <Skeleton className='h-8 w-1/3 bg-gray-300' />{' '}
          {/* Title */}
          {/* Event Form Skeleton */}
          <div className='my-6 bg-white rounded-lg shadow-sm p-4 space-y-4 border border-gray-200'>
            <Skeleton className='h-6 w-1/2 bg-gray-300 border-b pb-2' />{' '}
            {/* Form Title */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='col-span-2 space-y-1'>
                <Skeleton className='h-4 w-1/4 bg-gray-300' />{' '}
                {/* Label */}
                <Skeleton className='h-9 w-full bg-gray-300 rounded-md' />{' '}
                {/* Input */}
              </div>
              <div className='space-y-1'>
                <Skeleton className='h-4 w-1/3 bg-gray-300' />{' '}
                {/* Label */}
                <Skeleton className='h-9 w-full bg-gray-300 rounded-md' />{' '}
                {/* Input */}
              </div>
              <div className='space-y-1'>
                <Skeleton className='h-4 w-1/3 bg-gray-300' />{' '}
                {/* Label */}
                <Skeleton className='h-9 w-full bg-gray-300 rounded-md' />{' '}
                {/* Input */}
              </div>
              <div className='space-y-1'>
                <Skeleton className='h-4 w-1/4 bg-gray-300' />{' '}
                {/* Label */}
                <Skeleton className='h-9 w-full bg-gray-300 rounded-md' />{' '}
                {/* Input */}
              </div>
              <div className='col-span-2 space-y-1'>
                <Skeleton className='h-4 w-1/5 bg-gray-300' />{' '}
                {/* Label */}
                <Skeleton className='h-9 w-full bg-gray-300 rounded-md' />{' '}
                {/* Input */}
              </div>
              <div className='col-span-2 space-y-1'>
                <Skeleton className='h-4 w-1/4 bg-gray-300' />{' '}
                {/* Label */}
                <Skeleton className='h-20 w-full bg-gray-300 rounded-md' />{' '}
                {/* Textarea */}
              </div>
              <div className='col-span-2 space-y-1'>
                <Skeleton className='h-4 w-1/6 bg-gray-300' />{' '}
                {/* Label */}
                <Skeleton className='h-9 w-full bg-gray-300 rounded-md' />{' '}
                {/* Input */}
              </div>
            </div>
            <Skeleton className='h-11 w-full bg-gray-400 rounded-md mt-8' />{' '}
            {/* Submit Button */}
          </div>
          {/* Event List Skeleton */}
          <Skeleton className='h-6 w-1/2 bg-gray-300 border-b pb-2' />{' '}
          {/* List Title */}
          {/* Optional: Filter Button Skeletons */}
          <div className='flex flex-wrap gap-2 mb-4 border-b pb-4'>
            <Skeleton className='h-7 w-16 bg-gray-300 rounded-md' />
            <Skeleton className='h-7 w-20 bg-gray-300 rounded-md' />
            <Skeleton className='h-7 w-16 bg-gray-300 rounded-md' />
            <Skeleton className='h-7 w-24 bg-gray-300 rounded-md' />
          </div>
          {/* List Item Skeletons */}
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className='flex items-center space-x-4 p-3 border rounded-lg bg-gray-100/50'
              >
                <Skeleton className='h-16 w-16 bg-gray-300 rounded-lg flex-shrink-0' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-5 w-3/4 bg-gray-300' />
                  <Skeleton className='h-4 w-1/2 bg-gray-300' />
                </div>
                <div className='flex flex-col items-end space-y-2'>
                  <Skeleton className='h-4 w-12 bg-gray-300' />
                  <div className='flex gap-2'>
                    <Skeleton className='h-5 w-5 bg-gray-300 rounded' />
                    <Skeleton className='h-5 w-5 bg-gray-300 rounded' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton
