'use client'

import RatedListItem from './RatedListItem'

export default function RatedList({
  title,
  items,
  type,
  onItemDeleted,
}) {
  const linkPrefix =
    type === 'venue' ? '/venues' : '/events'

  return (
    <div
      className={`rounded-lg shadow-lg p-4 md:p-6 ${
        type === 'event'
          ? 'bg-[var(--primary-transparent)] text-[var(--gray-600)]'
          : 'bg-[var(--secondary-color-transparent)] text-[var(--blue-800)]'
      } md:min-w-[420px] flex flex-col`}
    >
      <h2 className='text-xl font-semibold mb-4'>
        {title}
      </h2>

      {items && items.length > 0 ? (
        <ul className='space-y-3 relative min-h-[150px] xl:h-[300px]'>
          {items.map((item) => (
            <RatedListItem
              key={item.targetId}
              item={item}
              type={type}
              linkPrefix={linkPrefix}
              onItemDeleted={onItemDeleted}
            />
          ))}
        </ul>
      ) : (
        <div className='flex-grow flex items-center justify-center h-[150px] xl:h-[300px]'>
          <p className='text-gray-500 italic'>
            Aún no tienes{' '}
            {type === 'venue' ? 'locales' : 'eventos'}{' '}
            favoritos.
          </p>
        </div>
      )}
    </div>
  )
}
