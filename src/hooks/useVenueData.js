import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase-client';

export function useVenueData ( uid ) {
    const [venue, setVenue] = useState( null );
    const [loading, setLoading] = useState( true );
    const [error, setError] = useState( null );

    useEffect( () => {
        const fetchVenueData = async () => {
            try {
                setLoading( true );
                const venueRef = doc( db, 'venues', uid );
                const venueSnapshot = await getDoc( venueRef );

                if ( venueSnapshot.exists() ) {
                    setVenue( {
                        id: venueSnapshot.id,
                        ...venueSnapshot.data(),
                    } );
                } else {
                    setVenue( null );
                }
            } catch ( error ) {
                setError( error );
            } finally {
                setLoading( false );
            }
        };

        if ( uid ) {
            fetchVenueData();
        }
    }, [uid] );

    return { venue, loading, error };
}