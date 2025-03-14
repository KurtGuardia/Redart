import '../styles/globals.css'
import AuthListener from '../../components/AuthListener'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <AuthListener />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
