import Head from "next/head"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Radarte - Descubre el arte y la cultura en Bolivia</title>
        <meta
          name="description"
          content="Radarte - Tu puerta de entrada a los espacios culturales y eventos artísticos en Bolivia"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

