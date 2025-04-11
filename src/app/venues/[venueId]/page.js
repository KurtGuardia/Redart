import Spot from '../../../components/ui/Spot'
import VenueDetailFetcher from '../../../components/venue/VenueDetailFetcher'
import VenueEventListWrapper from '../../../components/venue/VenueEventListWrapper'
import VenuePhotoGallery from '../../../components/venue/VenuePhotoGallery'
import VenueHeroSection from '../../../components/venue/VenueHeroSection'

export default function VenuePage({ params }) {
  const venueId = params.venueId

  return (
    <div className='relative min-h-screen w-full'>
      {/* Background Spots */}
      <Spot colorName={'Teal'} />
      <Spot colorName={'Cyan'} />
      <Spot colorName={'SkyBlue'} />
      <Spot colorName={'Indigo'} />

      {/* Hero Section (Now uses data directly) */}
      <VenueHeroSection venueId={venueId} />

      {/* Main Content Area */}
      <div className='container mx-auto px-4 pb-24'>
        <div className='bg-gradient-to-br from-white to-gray-100/80 backdrop-blur-lg rounded-xl shadow-xl p-6 md:p-10'>
          <VenueDetailFetcher venueId={venueId} />

          {/* Interactive Photo Gallery (Client Component) */}
          <VenuePhotoGallery venueId={venueId} />

          {/* Upcoming Events Section */}
          <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8'>
            <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-6'>
              Próximos Eventos
            </h2>
            <VenueEventListWrapper venueId={venueId} />
          </section>
        </div>
      </div>
    </div>
  )
}
