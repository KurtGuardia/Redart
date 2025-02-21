"use client"

import Layout from "../components/Layout"
import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore"
import { db } from "./_app"
import Link from "next/link"

const ITEMS_PER_PAGE = 9

export default function Campaigns () {
  const [campaigns, setCampaigns] = useState( [] )
  const [loading, setLoading] = useState( true )
  const [lastVisible, setLastVisible] = useState( null )
  const [hasMore, setHasMore] = useState( true )
  const [searchTerm, setSearchTerm] = useState( "" )
  const [filter, setFilter] = useState( "all" )

  useEffect( () => {
    fetchCampaigns()
  }, [] )

  const fetchCampaigns = async ( searchTerm = "", filter = "all" ) => {
    setLoading( true )
    let campaignsQuery = query( collection( db, "campaigns" ), orderBy( "date", "desc" ), limit( ITEMS_PER_PAGE ) )

    if ( lastVisible ) {
      campaignsQuery = query( campaignsQuery, startAfter( lastVisible ) )
    }

    const campaignsSnapshot = await getDocs( campaignsQuery )
    const campaignsList = campaignsSnapshot.docs.map( ( doc ) => ( { id: doc.id, ...doc.data() } ) )

    // Apply client-side filtering
    const filteredCampaigns = campaignsList.filter( ( campaign ) => {
      const matchesSearch =
        campaign.title.toLowerCase().includes( searchTerm.toLowerCase() ) ||
        campaign.description.toLowerCase().includes( searchTerm.toLowerCase() )
      const matchesFilter = filter === "all" || campaign.category === filter
      return matchesSearch && matchesFilter
    } )

    setCampaigns( ( prevCampaigns ) => [...prevCampaigns, ...filteredCampaigns] )
    setLastVisible( campaignsSnapshot.docs[campaignsSnapshot.docs.length - 1] )
    setHasMore( campaignsSnapshot.docs.length === ITEMS_PER_PAGE )
    setLoading( false )
  }

  const handleSearch = ( e ) => {
    e.preventDefault()
    setCampaigns( [] )
    setLastVisible( null )
    fetchCampaigns( searchTerm, filter )
  }

  const handleFilterChange = ( e ) => {
    setFilter( e.target.value )
    setCampaigns( [] )
    setLastVisible( null )
    fetchCampaigns( searchTerm, e.target.value )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Todas las campañas</h1>
        <form onSubmit={handleSearch} className="mb-8 flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={( e ) => setSearchTerm( e.target.value )}
            placeholder="Buscar campañas..."
            className="flex-grow px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <select
            value={filter}
            onChange={handleFilterChange}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="music">Música</option>
            <option value="art">Arte</option>
            <option value="theater">Teatro</option>
            <option value="dance">Danza</option>
          </select>
          <button
            type="submit"
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
          >
            Buscar
          </button>
        </form>
        {loading && campaigns.length === 0 ? (
          <p>Cargando campañas...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map( ( campaign ) => (
                <Link className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300" href={`/campaigns/${campaign.id}`} key={campaign.id}>
                  <img
                    src={campaign.imageUrl || "/placeholder.svg"}
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
                    <p className="text-gray-600 mb-2">{campaign.description.substring( 0, 100 )}...</p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{campaign.date}</span>
                      <span>{campaign.location}</span>
                      <span>{campaign.price}</span>
                    </div>
                  </div>
                </Link>
              ) )}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchCampaigns( searchTerm, filter )}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
                  disabled={loading}
                >
                  {loading ? "Cargando..." : "Cargar más"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

