// hooks/useBrowserLocationInstructions.js
import { useMemo } from 'react'

export function useBrowserLocationInstructions() {
  const getBrowserName = () => {
    const userAgent =
      typeof navigator !== 'undefined'
        ? navigator.userAgent
        : ''

    if (
      /chrome|crios/i.test(userAgent) &&
      !/edge|edgios|opr\//i.test(userAgent)
    ) {
      return 'chrome'
    }
    if (
      /safari/i.test(userAgent) &&
      !/chrome|crios|opr\//i.test(userAgent)
    ) {
      return 'safari'
    }
    if (/firefox|fxios/i.test(userAgent)) {
      return 'firefox'
    }
    if (/edg|edgios/i.test(userAgent)) {
      return 'edge'
    }
    if (
      /safari/i.test(userAgent) &&
      /iphone|ipad|ipod/i.test(userAgent)
    ) {
      return 'safari-ios'
    }
    return 'tu navegador'
  }

  const browser = useMemo(() => getBrowserName(), [])

  const instructions = useMemo(() => {
    switch (browser) {
      case 'chrome':
        return [
          'Haz clic en el icono de candado a la izquierda de la barra de direcciones.',
          'Busca la sección "Ubicación".',
          'Selecciona "Permitir" para este sitio.',
          'Recarga la página para aplicar los cambios.',
        ]
      case 'firefox':
        return [
          'Haz clic en el icono de candado a la izquierda de la barra de direcciones.',
          'Haz clic en "Más información".',
          'En la pestaña "Permisos", busca "Acceder a tu ubicación" y selecciona "Permitir".',
          'Recarga la página.',
        ]
      case 'edge':
        return [
          'Haz clic en el icono de candado a la izquierda de la barra de direcciones.',
          'Selecciona "Permisos para este sitio".',
          'Busca "Ubicación" y selecciona "Permitir".',
          'Recarga la página.',
        ]
      case 'safari':
        return [
          'En Safari, haz clic en "Safari" en la barra de menú y selecciona "Preferencias".',
          'Haz clic en la pestaña "Sitios web".',
          'Selecciona "Ubicación" en la barra lateral.',
          'Busca este sitio web y selecciona "Permitir".',
          'Recarga la página.',
        ]
      case 'safari-ios':
        return [
          'Abre la app "Configuración" de tu dispositivo.',
          'Desplázate y selecciona "Safari".',
          'Toca "Ubicación" y selecciona "Permitir".',
          'Vuelve a Safari y recarga la página.',
        ]
      default:
        return [
          'Busca los permisos de ubicación en la configuración de tu navegador.',
          'Permite el acceso a la ubicación para este sitio web.',
          'Recarga la página.',
        ]
    }
  }, [browser])

  return { browser, instructions }
}
