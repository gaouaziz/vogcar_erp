<template>
  <main class="container">
    <header class="header">
      <div class="logo-box">
        <span class="logo-icon">🚗</span>
        <h1>VogCar ERP</h1>
      </div>
      <p class="subtitle">Système de Gestion Intégré - Environnement <strong>{{ envName }}</strong></p>
    </header>

    <section class="card">
      <h2>État des Services</h2>
      
      <div v-if="pending" class="status-box loading">
        <span class="spinner"></span>
        <p>Vérification de la connexion aux services...</p>
      </div>

      <div v-else-if="error" class="status-box error">
        <div class="badge badge-error">API Injoignable</div>
        <p class="details">Impossible de contacter le backend API via la route <code>/api/status</code>.</p>
        <p class="hint">Erreur: {{ error.data?.statusMessage || error.statusMessage || error.message }}</p>
        <button class="btn-retry" @click="refresh()">Réessayer</button>
      </div>

      <div v-else class="status-box success">
        <div class="badge badge-success">Tous les systèmes sont opérationnels</div>
        
        <ul class="info-list">
          <li>
            <span class="label">Statut API :</span>
            <span class="value">{{ data?.status }} ({{ data?.message }})</span>
          </li>
          <li>
            <span class="label">Environnement Backend :</span>
            <span class="value uppercase">{{ data?.environment }}</span>
          </li>
          <li>
            <span class="label">Horodatage Base de Données :</span>
            <span class="value">{{ data?.db_time }}</span>
          </li>
          <li>
            <span class="label">Communication API :</span>
            <span class="value font-mono">/api/status (Proxy interne Nitro)</span>
          </li>
        </ul>

        <button class="btn-refresh" @click="refresh()">Actualiser le statut</button>
      </div>
    </section>
  </main>
</template>

<script setup>
const envName = process.env.NODE_ENV || 'development'

const { data, pending, error, refresh } = await useFetch('/api/status', {
  timeout: 5000,
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 3rem auto;
  padding: 0 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1e293b;
}

.header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 2.5rem;
}

h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
  font-size: 1.1rem;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
}

h2 {
  margin-top: 0;
  font-size: 1.25rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.75rem;
}

.status-box {
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.loading {
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #cbd5e1;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.badge-success {
  background: #dcfce7;
  color: #15803d;
}

.badge-error {
  background: #fee2e2;
  color: #b91c1c;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #e2e8f0;
}

.label {
  color: #64748b;
  font-weight: 500;
}

.value {
  color: #0f172a;
  font-weight: 600;
}

.font-mono {
  font-family: monospace;
}

.uppercase {
  text-transform: uppercase;
}

.hint {
  color: #ef4444;
  font-size: 0.875rem;
  background: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-refresh {
  background: #3b82f6;
  color: white;
}

.btn-refresh:hover {
  background: #2563eb;
}

.btn-retry {
  background: #ef4444;
  color: white;
  margin-top: 0.5rem;
}

.btn-retry:hover {
  background: #dc2626;
}
</style>
