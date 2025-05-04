/**
 * Translates Firebase Auth error codes into user-friendly Spanish messages.
 * @param {string} errorCode - The error code from Firebase Auth.
 * @returns {string} A user-friendly error message in Spanish.
 */
export function translateFirebaseAuthError(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.'
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.'
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado. Intenta iniciar sesión.'
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.'
    case 'auth/operation-not-allowed':
      return 'La operación no está permitida. Contacta al soporte.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.'
    case 'auth/network-request-failed':
      return 'Error de red. Verifica tu conexión a internet.'
    case 'auth/user-disabled':
      return 'Tu cuenta ha sido deshabilitada. Contacta al soporte.'
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo pero usando diferentes credenciales.'
    case 'auth/invalid-verification-code':
      return 'El código de verificación es inválido o ha expirado.'
    case 'auth/invalid-verification-id':
      return 'El ID de verificación es inválido.'
    case 'auth/code-expired':
      return 'El código ha expirado. Solicita uno nuevo.'
    case 'auth/credential-already-in-use':
      return 'Estas credenciales ya están en uso por otra cuenta.'
    case 'auth/invalid-phone-number':
      return 'El número de teléfono no es válido.'
    case 'auth/missing-phone-number':
      return 'Debes proporcionar un número de teléfono.'
    case 'auth/missing-verification-code':
      return 'Debes proporcionar el código de verificación.'
    case 'auth/missing-verification-id':
      return 'Falta el ID de verificación.'
    case 'auth/invalid-action-code':
      return 'El enlace es inválido o ha expirado.'
    case 'auth/expired-action-code':
      return 'El enlace ha expirado. Solicita uno nuevo.'
    case 'auth/invalid-custom-token':
      return 'El token personalizado no es válido.'
    case 'auth/custom-token-mismatch':
      return 'El token no coincide con el proyecto.'
    case 'auth/requires-recent-login':
      return 'Por seguridad, inicia sesión de nuevo para realizar esta acción.'
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana emergente. Habilítala para continuar.'
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana antes de completar la operación.'
    case 'auth/unauthorized-continue-uri':
      return 'La URL de continuación no está autorizada.'
    case 'auth/invalid-continue-uri':
      return 'La URL de continuación no es válida.'
    case 'auth/invalid-api-key':
      return 'Clave de API inválida. Revisa tu configuración.'
    case 'auth/app-not-authorized':
      return 'Esta app no está autorizada para usar Firebase Auth.'
    case 'auth/operation-not-supported-in-this-environment':
      return 'Esta operación no es compatible en el entorno actual.'
    case 'auth/invalid-emulator-scheme':
      return 'URL del emulador inválida. Debe ser http:// o https://.'
    case 'auth/missing-android-pkg-name':
      return 'Falta el nombre del paquete de Android.'
    case 'auth/missing-ios-bundle-id':
      return 'Falta el ID del paquete de iOS.'
    case 'auth/invalid-dynamic-link-domain':
      return 'El dominio de enlace dinámico no es válido o no está autorizado.'
    case 'auth/invalid-persistence-type':
      return 'El tipo de persistencia especificado no es válido.'
    case 'auth/unsupported-persistence-type':
      return 'El entorno actual no admite este tipo de persistencia.'
    case 'auth/invalid-tenant-id':
      return 'El ID de inquilino no es válido.'
    case 'auth/tenant-id-mismatch':
      return 'El ID de inquilino no coincide.'
    case 'auth/invalid-user-token':
      return 'Token de usuario inválido. Inicia sesión nuevamente.'
    case 'auth/user-token-expired':
      return 'La sesión expiró. Inicia sesión de nuevo.'
    case 'auth/invalid-claims':
      return 'Las reclamaciones personalizadas no son válidas.'
    case 'auth/claims-too-large':
      return 'Las reclamaciones personalizadas exceden el tamaño permitido.'
    case 'auth/invalid-session-cookie-duration':
      return 'Duración de cookie de sesión inválida.'
    case 'auth/invalid-argument':
      return 'Se proporcionó un argumento inválido.'
    case 'auth/internal-error':
      return 'Error interno. Intenta de nuevo más tarde.'
    case 'auth/invalid-app-id':
      return 'El ID de la app no está registrado.'
    case 'auth/invalid-oauth-client-id':
      return 'ID de cliente OAuth inválido.'
    case 'auth/invalid-oauth-provider':
      return 'Proveedor OAuth inválido.'
    case 'auth/invalid-provider-id':
      return 'ID de proveedor inválido.'
    case 'auth/invalid-recipient-email':
      return 'Correo electrónico del destinatario inválido.'
    case 'auth/invalid-sender':
      return 'Remitente del correo electrónico inválido.'
    case 'auth/invalid-message-payload':
      return 'La plantilla del correo contiene caracteres inválidos.'
    case 'auth/quota-exceeded':
      return 'Se ha excedido la cuota del servicio.'
    case 'auth/captcha-check-failed':
      return 'Falló la verificación de reCAPTCHA.'
    case 'auth/app-deleted':
      return 'La app de Firebase fue eliminada.'
    case 'auth/auth-domain-config-required':
      return 'Falta configurar el dominio de autenticación.'
    case 'auth/cordova-not-ready':
      return 'Cordova aún no está listo.'
    case 'auth/invalid-cordova-configuration':
      return 'Configuración de Cordova inválida.'
    default:
      console.warn(
        'Código de error de Firebase Auth no manejado:',
        errorCode,
      )
      return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
  }
}
