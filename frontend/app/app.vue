<template>
  <div class="app-layout">
    <!-- BARRE LATÉRALE DE NAVIGATION -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">🚗</div>
        <div>
          <h2>VogCar ERP</h2>
          <span class="brand-badge">Gestion d'Agence</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button 
          :class="['nav-item', { active: currentTab === 'dashboard' }]" 
          @click="currentTab = 'dashboard'"
        >
          <span class="nav-icon">📊</span>
          <span>Tableau de bord</span>
        </button>

        <button 
          :class="['nav-item', { active: currentTab === 'vehicles' }]" 
          @click="currentTab = 'vehicles'"
        >
          <span class="nav-icon">🚘</span>
          <span>Flotte Automobile</span>
          <span v-if="vehicles?.length" class="badge-count">{{ vehicles.length }}</span>
        </button>

        <button 
          :class="['nav-item', { active: currentTab === 'bookings' }]" 
          @click="currentTab = 'bookings'"
        >
          <span class="nav-icon">📅</span>
          <span>Réservations & Contrats</span>
          <span v-if="stats?.bookings?.active" class="badge-count badge-accent">{{ stats.bookings.active }}</span>
        </button>

        <button 
          :class="['nav-item', { active: currentTab === 'clients' }]" 
          @click="currentTab = 'clients'"
        >
          <span class="nav-icon">👥</span>
          <span>Clients & Conducteurs</span>
        </button>
      </nav>

      <!-- Statut du système en bas de la sidebar -->
      <div class="system-status-pill">
        <div class="status-indicator online"></div>
        <div class="status-info">
          <strong>Système Connecté</strong>
          <span>PostgreSQL & API Express</span>
        </div>
      </div>
    </aside>

    <!-- CONTENU PRINCIPAL -->
    <main class="main-content">
      <!-- HEADER DU DASHBOARD -->
      <header class="top-header">
        <div>
          <h1 class="page-title">{{ tabTitles[currentTab] }}</h1>
          <p class="page-subtitle">{{ tabSubtitles[currentTab] }}</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-outline" @click="openModal('vehicle')">
            <span>+</span> Véhicule
          </button>
          <button class="btn btn-outline" @click="openModal('client')">
            <span>+</span> Client
          </button>
          <button class="btn btn-primary" @click="openModal('booking')">
            <span>⚡</span> Nouvelle Réservation
          </button>
        </div>
      </header>

      <!-- NOTIFICATION TOAST SI DISPONIBLE -->
      <div v-if="toastMessage" class="toast-alert" :class="toastType">
        <span>{{ toastMessage }}</span>
        <button class="toast-close" @click="toastMessage = null">✕</button>
      </div>

      <!-- VUE 1 : TABLEAU DE BORD GÉNÉRAL -->
      <section v-if="currentTab === 'dashboard'" class="tab-view">
        <!-- 4 CARTES KPI -->
        <div class="kpi-grid">
          <div class="kpi-card card-blue">
            <div class="kpi-header">
              <span class="kpi-title">Véhicules Disponibles</span>
              <span class="kpi-icon">🚗</span>
            </div>
            <div class="kpi-value">
              {{ stats?.vehicles?.available ?? 0 }}
              <span class="kpi-sub">/ {{ stats?.vehicles?.total ?? 0 }} au total</span>
            </div>
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: getAvailabilityPercent() + '%' }"
              ></div>
            </div>
            <span class="kpi-footer">{{ getAvailabilityPercent() }}% de disponibilité immédiate</span>
          </div>

          <div class="kpi-card card-emerald">
            <div class="kpi-header">
              <span class="kpi-title">Locations en Cours</span>
              <span class="kpi-icon">🔑</span>
            </div>
            <div class="kpi-value">{{ stats?.bookings?.active ?? 0 }}</div>
            <p class="kpi-footer">Véhicules actuellement sur la route</p>
          </div>

          <div class="kpi-card card-indigo">
            <div class="kpi-header">
              <span class="kpi-title">Revenu Mensuel (Estimé)</span>
              <span class="kpi-icon">💶</span>
            </div>
            <div class="kpi-value">{{ formatCurrency(stats?.bookings?.monthly_revenue ?? 0) }}</div>
            <p class="kpi-footer">Total facturé ce mois-ci</p>
          </div>

          <div class="kpi-card card-purple">
            <div class="kpi-header">
              <span class="kpi-title">Conducteurs Enregistrés</span>
              <span class="kpi-icon">👥</span>
            </div>
            <div class="kpi-value">{{ stats?.clients?.total ?? 0 }}</div>
            <p class="kpi-footer">Clients dans le carnet d'adresses</p>
          </div>
        </div>

        <!-- GRILLE PRINCIPALE : VÉHICULES DISPOS & DERNIÈRES RÉSERVATIONS -->
        <div class="dashboard-grid">
          <!-- Flotte en direct -->
          <div class="dashboard-panel">
            <div class="panel-header">
              <h3>État Rapide du Parc Automobile</h3>
              <button class="link-btn" @click="currentTab = 'vehicles'">Voir tous →</button>
            </div>

            <div class="vehicle-cards-list">
              <div 
                v-for="v in vehicles?.slice(0, 4)" 
                :key="v.id" 
                class="vehicle-mini-card"
              >
                <div class="vehicle-mini-top">
                  <div>
                    <h4 class="vehicle-mini-name">{{ v.brand }} {{ v.model }}</h4>
                    <span class="license-plate">{{ v.registration_number }}</span>
                  </div>
                  <span :class="['status-tag', 'status-' + v.status.toLowerCase()]">
                    {{ formatStatus(v.status) }}
                  </span>
                </div>
                <div class="vehicle-mini-specs">
                  <span>⛽ {{ formatFuel(v.fuel_type) }}</span>
                  <span>⚙️ {{ v.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle' }}</span>
                  <span>🛣️ {{ Number(v.current_mileage).toLocaleString() }} km</span>
                  <span class="vehicle-rate">{{ formatCurrency(v.effective_daily_rate) }}/j</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dernières Réservations -->
          <div class="dashboard-panel">
            <div class="panel-header">
              <h3>Activité Récente des Contrats</h3>
              <button class="link-btn" @click="currentTab = 'bookings'">Voir tous →</button>
            </div>

            <div v-if="!stats?.recentBookings?.length" class="empty-state">
              <p>Aucune réservation récente trouvée.</p>
              <button class="btn btn-sm btn-primary" @click="openModal('booking')">Créer la 1ère réservation</button>
            </div>

            <div v-else class="recent-bookings-list">
              <div 
                v-for="b in stats.recentBookings" 
                :key="b.id" 
                class="booking-item-card"
              >
                <div class="booking-item-header">
                  <div>
                    <span class="booking-ref">{{ b.booking_reference }}</span>
                    <strong class="booking-client">{{ b.client_first_name }} {{ b.client_last_name }}</strong>
                  </div>
                  <span :class="['status-tag', 'status-' + b.status.toLowerCase()]">
                    {{ formatStatus(b.status) }}
                  </span>
                </div>

                <div class="booking-item-body">
                  <span>🚗 {{ b.vehicle_brand }} {{ b.vehicle_model }} ({{ b.registration_number }})</span>
                  <span>📅 Du {{ formatDate(b.start_date) }} au {{ formatDate(b.end_date) }}</span>
                </div>

                <div class="booking-item-footer">
                  <span class="booking-price">Total : <strong>{{ formatCurrency(b.total_price) }}</strong></span>
                  <span v-if="b.client_phone" class="booking-phone">📞 {{ b.client_phone }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VUE 2 : FLOTTE AUTOMOBILE -->
      <section v-if="currentTab === 'vehicles'" class="tab-view">
        <div class="filter-bar">
          <input 
            v-model="vehicleSearch" 
            type="text" 
            placeholder="Rechercher par marque, modèle ou plaque..." 
            class="input-search"
            @input="fetchVehicles"
          />

          <div class="filter-chips">
            <button 
              :class="['chip', { active: vehicleStatusFilter === 'ALL' }]" 
              @click="setVehicleFilter('ALL')"
            >
              Tous ({{ vehicles?.length || 0 }})
            </button>
            <button 
              :class="['chip', { active: vehicleStatusFilter === 'AVAILABLE' }]" 
              @click="setVehicleFilter('AVAILABLE')"
            >
              Disponibles
            </button>
            <button 
              :class="['chip', { active: vehicleStatusFilter === 'RENTED' }]" 
              @click="setVehicleFilter('RENTED')"
            >
              En Location
            </button>
            <button 
              :class="['chip', { active: vehicleStatusFilter === 'MAINTENANCE' }]" 
              @click="setVehicleFilter('MAINTENANCE')"
            >
              En Maintenance
            </button>
          </div>
        </div>

        <div class="vehicles-grid">
          <div 
            v-for="v in vehicles" 
            :key="v.id" 
            class="vehicle-full-card"
          >
            <div class="vehicle-card-header">
              <span class="vehicle-cat">{{ v.category_name || 'Standard' }}</span>
              <span :class="['status-tag', 'status-' + v.status.toLowerCase()]">
                {{ formatStatus(v.status) }}
              </span>
            </div>

            <div class="vehicle-card-main">
              <h3>{{ v.brand }} {{ v.model }}</h3>
              <div class="plate-box">{{ v.registration_number }}</div>
            </div>

            <div class="vehicle-card-specs">
              <div class="spec-item">
                <span class="spec-label">Année</span>
                <span class="spec-val">{{ v.year }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Énergie</span>
                <span class="spec-val">{{ formatFuel(v.fuel_type) }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Kilométrage</span>
                <span class="spec-val">{{ Number(v.current_mileage).toLocaleString() }} km</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Tarif Journalier</span>
                <span class="spec-val text-primary font-bold">{{ formatCurrency(v.effective_daily_rate) }}</span>
              </div>
            </div>

            <div class="vehicle-card-actions">
              <button 
                v-if="v.status === 'AVAILABLE'" 
                class="btn btn-sm btn-outline"
                @click="updateVehicleStatus(v.id, 'MAINTENANCE')"
              >
                🛠️ Mettre en révision
              </button>
              <button 
                v-else-if="v.status === 'MAINTENANCE'" 
                class="btn btn-sm btn-success"
                @click="updateVehicleStatus(v.id, 'AVAILABLE')"
              >
                ✅ Rendre disponible
              </button>
              <button 
                v-if="v.status === 'AVAILABLE'" 
                class="btn btn-sm btn-primary"
                @click="prepareBookingForVehicle(v)"
              >
                Louer
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- VUE 3 : RÉSERVATIONS -->
      <section v-if="currentTab === 'bookings'" class="tab-view">
        <div class="panel-box">
          <table class="data-table">
            <thead>
              <tr>
                <th>Réf. Contrat</th>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Dates</th>
                <th>Durée</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!bookings?.length">
                <td colspan="8" class="text-center py-4">Aucune réservation trouvée.</td>
              </tr>
              <tr v-for="b in bookings" :key="b.id">
                <td><strong class="font-mono text-primary">{{ b.booking_reference }}</strong></td>
                <td>
                  <strong>{{ b.client_first_name }} {{ b.client_last_name }}</strong>
                  <div class="text-xs text-muted">{{ b.client_phone }}</div>
                </td>
                <td>
                  <strong>{{ b.vehicle_brand }} {{ b.vehicle_model }}</strong>
                  <div class="text-xs font-mono">{{ b.registration_number }}</div>
                </td>
                <td>
                  {{ formatDate(b.start_date) }} → {{ formatDate(b.end_date) }}
                </td>
                <td>{{ b.total_days }} j</td>
                <td><strong class="text-dark">{{ formatCurrency(b.total_price) }}</strong></td>
                <td>
                  <span :class="['status-tag', 'status-' + b.status.toLowerCase()]">
                    {{ formatStatus(b.status) }}
                  </span>
                </td>
                <td>
                  <button 
                    v-if="b.status === 'ACTIVE'" 
                    class="btn btn-sm btn-success"
                    @click="promptCompleteBooking(b)"
                  >
                    Restituer Véhicule
                  </button>
                  <span v-else class="text-xs text-muted">Archivé</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- VUE 4 : CLIENTS -->
      <section v-if="currentTab === 'clients'" class="tab-view">
        <div class="panel-box">
          <table class="data-table">
            <thead>
              <tr>
                <th>Conducteur / Client</th>
                <th>Coordonnées</th>
                <th>N° Permis de Conduire</th>
                <th>Ville</th>
                <th>Date d'inscription</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!clients?.length">
                <td colspan="5" class="text-center py-4">Aucun client enregistré.</td>
              </tr>
              <tr v-for="c in clients" :key="c.id">
                <td>
                  <strong>{{ c.first_name }} {{ c.last_name }}</strong>
                </td>
                <td>
                  <div>📞 {{ c.phone }}</div>
                  <div class="text-xs text-muted">✉️ {{ c.email }}</div>
                </td>
                <td>
                  <span class="badge-code">{{ c.driving_license_number }}</span>
                </td>
                <td>{{ c.city || 'Non renseignée' }}</td>
                <td class="text-sm text-muted">{{ formatDate(c.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- MODALE : NOUVELLE RÉSERVATION -->
    <div v-if="showModal === 'booking'" class="modal-overlay" @click.self="showModal = null">
      <div class="modal-box">
        <div class="modal-header">
          <h3>⚡ Créer une Nouvelle Réservation</h3>
          <button class="modal-close" @click="showModal = null">✕</button>
        </div>

        <form class="modal-form" @submit.prevent="submitBooking">
          <div class="form-group">
            <label>Client Conducteur *</label>
            <select v-model="newBooking.client_id" required>
              <option value="" disabled>Sélectionnez un client...</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.first_name }} {{ c.last_name }} ({{ c.phone }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Véhicule à Louer *</label>
            <select v-model="newBooking.vehicle_id" required>
              <option value="" disabled>Sélectionnez un véhicule disponible...</option>
              <option 
                v-for="v in availableVehiclesList" 
                :key="v.id" 
                :value="v.id"
              >
                {{ v.brand }} {{ v.model }} ({{ v.registration_number }}) - {{ formatCurrency(v.effective_daily_rate) }}/j
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date de Début *</label>
              <input v-model="newBooking.start_date" type="date" required />
            </div>
            <div class="form-group">
              <label>Date de Fin *</label>
              <input v-model="newBooking.end_date" type="date" required />
            </div>
          </div>

          <div class="form-group">
            <label>Notes ou Options</label>
            <textarea v-model="newBooking.notes" rows="2" placeholder="Ex: Siège bébé, GPS..."></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showModal = null">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Création en cours...' : 'Confirmer le Contrat' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODALE : AJOUTER UN VÉHICULE -->
    <div v-if="showModal === 'vehicle'" class="modal-overlay" @click.self="showModal = null">
      <div class="modal-box">
        <div class="modal-header">
          <h3>🚘 Ajouter un Nouveau Véhicule</h3>
          <button class="modal-close" @click="showModal = null">✕</button>
        </div>

        <form class="modal-form" @submit.prevent="submitVehicle">
          <div class="form-row">
            <div class="form-group">
              <label>Marque *</label>
              <input v-model="newVehicle.brand" placeholder="Ex: Peugeot" required />
            </div>
            <div class="form-group">
              <label>Modèle *</label>
              <input v-model="newVehicle.model" placeholder="Ex: 208" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Immatriculation (Plaque) *</label>
              <input v-model="newVehicle.registration_number" placeholder="Ex: AA-123-BB" required />
            </div>
            <div class="form-group">
              <label>Année *</label>
              <input v-model.number="newVehicle.year" type="number" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Carburant *</label>
              <select v-model="newVehicle.fuel_type" required>
                <option value="PETROL">Essence</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybride</option>
                <option value="ELECTRIC">Électrique</option>
              </select>
            </div>
            <div class="form-group">
              <label>Transmission *</label>
              <select v-model="newVehicle.transmission" required>
                <option value="MANUAL">Manuelle</option>
                <option value="AUTOMATIC">Automatique</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Kilométrage Actuel</label>
              <input v-model.number="newVehicle.current_mileage" type="number" placeholder="Ex: 25000" />
            </div>
            <div class="form-group">
              <label>Tarif Journalier (€/j)</label>
              <input v-model.number="newVehicle.daily_rate" type="number" step="0.5" placeholder="Ex: 45.00" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showModal = null">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Enregistrement...' : 'Ajouter au Parc' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODALE : AJOUTER UN CLIENT -->
    <div v-if="showModal === 'client'" class="modal-overlay" @click.self="showModal = null">
      <div class="modal-box">
        <div class="modal-header">
          <h3>👤 Nouveau Client Conducteur</h3>
          <button class="modal-close" @click="showModal = null">✕</button>
        </div>

        <form class="modal-form" @submit.prevent="submitClient">
          <div class="form-row">
            <div class="form-group">
              <label>Prénom *</label>
              <input v-model="newClient.first_name" required />
            </div>
            <div class="form-group">
              <label>Nom *</label>
              <input v-model="newClient.last_name" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email *</label>
              <input v-model="newClient.email" type="email" required />
            </div>
            <div class="form-group">
              <label>Téléphone *</label>
              <input v-model="newClient.phone" placeholder="+33 6 ..." required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Numéro de Permis de Conduire *</label>
              <input v-model="newClient.driving_license_number" placeholder="Ex: 12AA34567" required />
            </div>
            <div class="form-group">
              <label>Ville</label>
              <input v-model="newClient.city" placeholder="Ex: Paris" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="showModal = null">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Enregistrement...' : 'Créer le Client' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentTab = ref('dashboard')
const showModal = ref(null)
const submitting = ref(false)
const toastMessage = ref(null)
const toastType = ref('success')

const vehicleSearch = ref('')
const vehicleStatusFilter = ref('ALL')

const tabTitles = {
  dashboard: "Tableau de Bord de l'Agence",
  vehicles: "Gestion de la Flotte Automobile",
  bookings: "Contrats de Location & Réservations",
  clients: "Répertoire des Clients & Conducteurs",
}

const tabSubtitles = {
  dashboard: "Vue synthétique des disponibilités, alertes et performances de VogCar ERP.",
  vehicles: "Consultez, filtrez et gérez l'état de chaque véhicule de votre parc.",
  bookings: "Suivez les départs, retours et encaissements des contrats en cours.",
  clients: "Historique des conducteurs et vérification des permis de conduire.",
}

// Données réactives
const stats = ref(null)
const vehicles = ref([])
const bookings = ref([])
const clients = ref([])

// Formulaires
const newBooking = ref({
  client_id: '',
  vehicle_id: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  notes: '',
})

const newVehicle = ref({
  brand: '',
  model: '',
  registration_number: '',
  year: new Date().getFullYear(),
  fuel_type: 'PETROL',
  transmission: 'MANUAL',
  current_mileage: 10000,
  daily_rate: 45,
})

const newClient = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  driving_license_number: '',
  city: '',
})

// Chargement des données
async function loadAllData() {
  try {
    const [statsRes, vehiclesRes, bookingsRes, clientsRes] = await Promise.all([
      $fetch('/api/dashboard/stats').catch(() => null),
      $fetch('/api/vehicles').catch(() => null),
      $fetch('/api/bookings').catch(() => null),
      $fetch('/api/clients').catch(() => null),
    ])

    if (statsRes?.data) stats.value = statsRes.data
    if (vehiclesRes?.data) vehicles.value = vehiclesRes.data
    if (bookingsRes?.data) bookings.value = bookingsRes.data
    if (clientsRes?.data) clients.value = clientsRes.data
  } catch (err) {
    console.error('Erreur chargement ERP:', err)
  }
}

onMounted(() => {
  loadAllData()
})

const availableVehiclesList = computed(() => {
  return vehicles.value.filter(v => v.status === 'AVAILABLE')
})

function getAvailabilityPercent() {
  const total = stats.value?.vehicles?.total || 0
  if (!total) return 100
  const avail = stats.value?.vehicles?.available || 0
  return Math.round((avail / total) * 100)
}

function openModal(type) {
  showModal.value = type
}

function prepareBookingForVehicle(v) {
  newBooking.value.vehicle_id = v.id
  currentTab.value = 'dashboard'
  showModal.value = 'booking'
}

function showToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

// Filtre des véhicules
async function fetchVehicles() {
  try {
    const params = new URLSearchParams()
    if (vehicleStatusFilter.value !== 'ALL') params.append('status', vehicleStatusFilter.value)
    if (vehicleSearch.value) params.append('search', vehicleSearch.value)

    const res = await $fetch(`/api/vehicles?${params.toString()}`)
    if (res?.data) vehicles.value = res.data
  } catch (err) {
    console.error(err)
  }
}

function setVehicleFilter(status) {
  vehicleStatusFilter.value = status
  fetchVehicles()
}

// Actions de soumission
async function submitBooking() {
  submitting.value = true
  try {
    const res = await $fetch('/api/bookings', {
      method: 'POST',
      body: newBooking.value,
    })

    if (res?.success) {
      showToast(`Réservation ${res.data.booking_reference} créée avec succès !`)
      showModal.value = null
      await loadAllData()
    }
  } catch (err) {
    showToast(err.data?.error || 'Erreur lors de la réservation', 'error')
  } finally {
    submitting.value = false
  }
}

async function submitVehicle() {
  submitting.value = true
  try {
    const res = await $fetch('/api/vehicles', {
      method: 'POST',
      body: newVehicle.value,
    })

    if (res?.success) {
      showToast(`Véhicule ${res.data.brand} ${res.data.model} ajouté au parc !`)
      showModal.value = null
      await loadAllData()
    }
  } catch (err) {
    showToast(err.data?.error || 'Erreur lors de l\'ajout du véhicule', 'error')
  } finally {
    submitting.value = false
  }
}

async function submitClient() {
  submitting.value = true
  try {
    const res = await $fetch('/api/clients', {
      method: 'POST',
      body: newClient.value,
    })

    if (res?.success) {
      showToast(`Client ${res.data.first_name} ${res.data.last_name} enregistré !`)
      showModal.value = null
      await loadAllData()
    }
  } catch (err) {
    showToast(err.data?.error || 'Erreur lors de l\'enregistrement du client', 'error')
  } finally {
    submitting.value = false
  }
}

async function updateVehicleStatus(id, newStatus) {
  try {
    const res = await $fetch(`/api/vehicles/${id}/status`, {
      method: 'PATCH',
      body: { status: newStatus },
    })
    if (res?.success) {
      showToast('Statut du véhicule mis à jour !')
      await loadAllData()
    }
  } catch (err) {
    showToast('Erreur mise à jour statut', 'error')
  }
}

async function promptCompleteBooking(b) {
  const km = prompt(`Restitution du véhicule ${b.vehicle_brand} ${b.vehicle_model} (${b.registration_number}).\nEntrez le kilométrage de retour :`, '20000')
  if (km === null) return

  try {
    const res = await $fetch(`/api/bookings/${b.id}/status`, {
      method: 'PATCH',
      body: { status: 'COMPLETED', end_mileage: parseInt(km, 10) || null },
    })
    if (res?.success) {
      showToast('Location clôturée et véhicule rendu disponible !')
      await loadAllData()
    }
  } catch (err) {
    showToast('Erreur lors de la clôture', 'error')
  }
}

// Fonctions de formatage
function formatCurrency(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatStatus(status) {
  const map = {
    AVAILABLE: 'Disponible',
    RENTED: 'En location',
    MAINTENANCE: 'Maintenance',
    RESERVED: 'Réservé',
    ACTIVE: 'En cours',
    COMPLETED: 'Clôturé',
    PENDING: 'En attente',
    CANCELLED: 'Annulé',
  }
  return map[status] || status
}

function formatFuel(fuel) {
  const map = {
    PETROL: 'Essence',
    DIESEL: 'Diesel',
    HYBRID: 'Hybride',
    ELECTRIC: 'Électrique',
  }
  return map[fuel] || fuel
}
</script>

<style scoped>
/* RESET & BASE */
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1e293b;
}

/* SIDEBAR */
.sidebar {
  width: 260px;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  border-right: 1px solid #1e293b;
  flex-shrink: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 1.5rem;
}

.brand-icon {
  font-size: 2rem;
}

.sidebar-brand h2 {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
}

.brand-badge {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  border: none;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: #1e293b;
  color: #ffffff;
}

.nav-item.active {
  background: #2563eb;
  color: #ffffff;
  font-weight: 600;
}

.badge-count {
  margin-left: auto;
  background: #334155;
  color: #f1f5f9;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
}

.badge-accent {
  background: #10b981;
}

.system-status-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #1e293b;
  border-radius: 8px;
  font-size: 0.8rem;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-info strong {
  color: #f8fafc;
}

.status-info span {
  color: #94a3b8;
  font-size: 0.75rem;
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  color: #64748b;
  margin-top: 0.25rem;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* BOUTONS */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}
.btn-primary:hover {
  background: #1d4ed8;
}

.btn-outline {
  background: white;
  border-color: #cbd5e1;
  color: #334155;
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-success {
  background: #10b981;
  color: white;
}
.btn-success:hover {
  background: #059669;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

/* TOAST ALERT */
.toast-alert {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}
.toast-alert.success {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}
.toast-alert.error {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}
.toast-close {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
}

/* KPIS */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.kpi-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.kpi-icon {
  font-size: 1.25rem;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}

.kpi-sub {
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
}

.progress-bar-bg {
  height: 6px;
  background: #f1f5f9;
  border-radius: 9999px;
  margin: 0.75rem 0 0.5rem 0;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.kpi-footer {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

/* DASHBOARD PANELS */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.75rem;
}

.panel-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
}

/* CARTES VÉHICULES MINI (DASHBOARD) */
.vehicle-cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.vehicle-mini-card {
  border: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
}

.vehicle-mini-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.vehicle-mini-name {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.license-plate {
  display: inline-block;
  background: #e2e8f0;
  font-family: monospace;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  margin-top: 0.25rem;
}

.vehicle-mini-specs {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #64748b;
  align-items: center;
}

.vehicle-rate {
  margin-left: auto;
  font-weight: 700;
  color: #0f172a;
}

/* BADGES DE STATUT */
.status-tag {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-available { background: #dcfce7; color: #166534; }
.status-rented { background: #dbeafe; color: #1e40af; }
.status-maintenance { background: #fef3c7; color: #92400e; }
.status-reserved { background: #f3e8ff; color: #6b21a8; }
.status-active { background: #dbeafe; color: #1e40af; }
.status-completed { background: #f1f5f9; color: #475569; }

/* RÉSERVATIONS RÉCENTES */
.recent-bookings-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.booking-item-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.booking-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.booking-ref {
  display: block;
  font-size: 0.75rem;
  font-family: monospace;
  color: #64748b;
}

.booking-client {
  font-size: 0.95rem;
  color: #0f172a;
}

.booking-item-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #475569;
  margin-bottom: 0.5rem;
}

.booking-item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  border-top: 1px dashed #e2e8f0;
  padding-top: 0.5rem;
}

/* VUE FLOTTE AUTOMOBILE */
.filter-bar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.input-search {
  flex: 1;
  min-width: 250px;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s;
}

.chip.active {
  background: #0f172a;
  color: white;
  border-color: #0f172a;
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.vehicle-full-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.vehicle-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.vehicle-cat {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.vehicle-card-main h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.plate-box {
  display: inline-block;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  font-family: monospace;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  margin: 0.5rem 0 1rem 0;
}

.vehicle-card-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  padding: 0.75rem 0;
  margin-bottom: 1.25rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
}

.spec-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.spec-val {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.vehicle-card-actions {
  margin-top: auto;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* TABLES (RÉSERVATIONS & CLIENTS) */
.panel-box {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.data-table th {
  background: #f8fafc;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  font-weight: 600;
}

.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.badge-code {
  background: #f1f5f9;
  font-family: monospace;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

/* MODALES */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1.5rem;
}

.modal-box {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}

.font-mono { font-family: monospace; }
.text-primary { color: #2563eb; }
.text-muted { color: #64748b; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.85rem; }
.text-center { text-align: center; }
.py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.font-bold { font-weight: 700; }
</style>
