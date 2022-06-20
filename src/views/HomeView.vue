<template>
  <div>
    <b-container>
      <b-jumbotron class="mb-3" header="Closest Hill Map" lead="Find the closest hills to your location.">
        <p>Use the controls below to toggle hill types, select the interaction mode and the number of hills.</p>
        <b-button variant="primary" :to="{ name: 'about' }">Find out more</b-button>
      </b-jumbotron>
      <div class="d-flex flex-wrap justify-content-center align-items-center">
        <b-button-group class="flex-wrap mx-2 mb-3">
          <b-button
            v-for="hill in hillTypes"
            :key="`hill-type-${hill.name}`"
            :pressed.sync="hill.state"><span :style="{ color: hill.state ? hill.color : '#999' }">⬤</span> <span class="hill-name">{{ hill.name }}</span></b-button>
        </b-button-group>
        <b-button-group class="flex-wrap mx-2 mb-3">
          <b-button v-for="mode in updateModes" :key="`update-mode-${mode.value}`" :pressed="mode.value === updateMode" @click="updateMode = mode.value">
            <component :is="mode.icon" /> {{ mode.text }}
          </b-button>
        </b-button-group>
        <b-form inline @submit.prevent class="mx-2 mb-3">
          <b-input-group>
            <b-input-group-prepend is-text>
              <BIconSortNumericUpAlt />
            </b-input-group-prepend>
            <b-input v-model.number="hillCount" type="number" />
          </b-input-group>
        </b-form>
      </div>
    </b-container>
    <div id="map">
    </div>

    <footer class="footer py-3 bg-dark">
      <b-container class="text-center">
        <span class="text-muted">This page was created by <a href="https://github.com/sebastian-raubach">Sebastian Raubach</a>. If you would like to support him, you can <a href="https://github.com/sponsors/sebastian-raubach">buy him a coffee ☕</a>.</span>
      </b-container>
    </footer>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import tinygradient from 'tinygradient'
import { distance, nearestPoint, point, featureCollection } from '@turf/turf'
import { BIconArrowsMove, BIconCursor, BIconGeoAltFill, BIconHandIndex, BIconSortNumericUpAlt } from 'bootstrap-vue'

const gradient = tinygradient(['#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'])
const allHills = require('@/assets/hills.json')

let mapMarkers = []
let mapLines = []

export default {
  components: {
    BIconSortNumericUpAlt
  },
  data: function () {
    return {
      updateMode: 'center',
      hillCount: 10,
      lastEventLocation: null,
      geolocationWatchId: null,
      updateModes: [
        { text: 'Center of  map', value: 'center', icon: BIconArrowsMove },
        { text: 'Click', value: 'click', icon: BIconHandIndex },
        { text: 'Follow mouse', value: 'mouse', icon: BIconCursor },
        { text: 'My location', value: 'gps', icon: BIconGeoAltFill }
      ],
      hillTypes: [
        { name: 'munro', color: '#eb3b5a', state: true },
        { name: 'corbett', color: '#fa8231', state: true },
        { name: 'graham', color: '#20bf6b', state: true },
        { name: 'donald', color: '#0fb9b1', state: true }
      ],
      debouncer: this.debounce(() => this.updateLines())
    }
  },
  computed: {
    hills: function () {
      // Filter hills on type state
      const types = this.hillTypes.filter(ht => ht.state).map(ht => ht.name)
      return allHills.filter(h => types.includes(h.type))
    },
    features: function () {
      // Create a feature to find closest hill
      return featureCollection([...this.hills.map((h, i) => point([h.lat, h.lng], { name: h.name, id: i }))])
    }
  },
  watch: {
    hills: function () {
      // When the hills change, update everything
      this.updateMarkers()
      this.updateLines()
    },
    updateMode: function (newValue, oldValue) {
      // Remove all handlers
      if (oldValue === 'center') {
        this.map.off('move', this.debouncer)
      } else if (oldValue === 'click') {
        this.map.off('click', this.updateLines)
      } else if (oldValue === 'mouse') {
        this.map.off('mousemove', this.updateLines)
      } else if (oldValue === 'gps') {
        if (this.geolocationWatchId && navigator.geolocation) {
          navigator.geolocation.clearWatch(this.geolocationWatchId)
        }
      }

      // Add handlers depending on mode
      if (newValue === 'center') {
        this.map.on('move', this.debouncer)
      } else if (newValue === 'click') {
        this.map.on('click', this.updateLines)
      } else if (newValue === 'mouse') {
        this.map.on('mousemove', this.updateLines)
      } else if (newValue === 'gps') {
        const options = { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
        this.geolocationWatchId = navigator.geolocation.watchPosition(position => {
          if (position && position.coords) {
            this.lastEventLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }

            this.updateLines()
          } else {
            this.lastEventLocation = null
            this.updateLines()
          }
        }, null, options)
      }

      // Update the lines
      this.updateLines()
    },
    hillCount: function () {
      // Update the lines when the number of line parameter changes
      this.updateLines()
    }
  },
  methods: {
    debounce: function (func, timeout = 5) {
      let timer
      return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => { func.apply(this, args) }, timeout)
      }
    },
    updateMarkers: function (updateBounds = false) {
      // Remove all old markers
      mapMarkers.forEach(m => this.map.removeLayer(m))

      // Add new markers based on the filtered list, store in data
      mapMarkers = this.hills.map(h => {
        // Get the color
        const color = this.hillTypes.find(ht => ht.name === h.type).color
        // Create the marker
        const marker = L.circleMarker([h.lat, h.lng], {
          stroke: false,
          radius: 4,
          fillOpacity: 0.75,
          fillColor: color
        }).bindPopup(h.name)

        // Add to map
        marker.addTo(this.map)

        return marker
      })

      if (updateBounds) {
        // Calculate the bounds of the map based on the markers
        const bounds = L.latLngBounds()

        mapMarkers.forEach(m => bounds.extend(m.getLatLng()))

        if (bounds.isValid()) {
          this.map.fitBounds(bounds.pad(0.1))
        }
      }
    },
    updateLines: function (e) {
      // Remove all lines
      mapLines.forEach(l => this.map.removeLayer(l))

      let target

      if (this.updateMode === 'center') {
        // Get the map center
        target = point([this.map.getCenter().lat, this.map.getCenter().lng])
      } else if (this.updateMode === 'click' || this.updateMode === 'mouse' || this.updateMode === 'gps') {
        let latlng
        if (!e) {
          // Try and restore the previous target
          latlng = this.lastEventLocation
        } else {
          // Use the parameter
          latlng = e.latlng
          this.lastEventLocation = e.latlng
        }

        // If nothing available, return
        if (!latlng) {
          return
        }

        target = point([latlng.lat, latlng.lng])
      }

      const coll = JSON.parse(JSON.stringify(this.features))
      const nearestList = []

      if (!coll || coll.features.length < 1) {
        return
      }

      const limit = Math.min(this.hillCount, coll.features.length)
      // Get the nearest ones, removing the nearest in each iteration
      for (let i = 0; i < limit; i++) {
        const nearest = nearestPoint(target, coll)
        const dist = distance(target, nearest)

        nearestList.push({ point: nearest.geometry.coordinates, dist: dist })

        const index = coll.features.findIndex(n => n.properties.id === nearest.properties.id)
        if (index !== -1) {
          coll.features.splice(index, 1)
        }
      }

      // Create the lines
      mapLines = nearestList.map((n, i) => {
        const line = L.polyline([target.geometry.coordinates, n.point], {
          interactive: false,
          opacity: 0.75,
          color: gradient.rgbAt((i + 1) / nearestList.length)
        })

        line.addTo(this.map)

        return line
      })
    }
  },
  mounted: function () {
    // Add OSM as the default
    const openstreetmap = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: 'OpenStreetMap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c']
    })

    this.map = L.map('map').setView([51.505, -0.09], 13)
    this.map.addLayer(openstreetmap)

    // Initially, add the move handler
    this.map.on('move', this.debouncer)

    // Disable scrolling until map gains focus, remove scrolling when it loses focus
    this.map.scrollWheelZoom.disable()
    this.map.on('focus', () => this.map.scrollWheelZoom.enable())
    this.map.on('blur', () => this.map.scrollWheelZoom.disable())

    // Add an additional satellite layer
    const satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      id: 'Esri WorldImagery',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })

    const baseMaps = {
      OpenStreetMap: openstreetmap,
      'Esri WorldImagery': satellite
    }

    L.control.layers(baseMaps).addTo(this.map)

    // Update the markers initially
    this.updateMarkers(true)
  }
}
</script>

<style scoped>
#map {
  height: 90vh;
}
.hill-name {
  text-transform: capitalize;
}
</style>
