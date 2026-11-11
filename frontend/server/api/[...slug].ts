export default defineEventHandler(async (event) => {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:5000'
  const target = `${backendUrl}${event.path}`

  try {
    return await proxyRequest(event, target)
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `Erreur Proxy : impossible de joindre le backend Express sur ${target}`,
      data: { error: error?.message },
    })
  }
})
