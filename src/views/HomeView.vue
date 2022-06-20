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
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import tinygradient from 'tinygradient'
import { distance, nearestPoint, point, featureCollection } from '@turf/turf'
import { BIconArrowsMove, BIconCursor, BIconHandIndex, BIconSortNumericUpAlt } from 'bootstrap-vue'

const gradient = tinygradient(['#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'])
const allHills = require('@/assets/hills.json')

export default {
  components: {
    BIconSortNumericUpAlt
  },
  data: function () {
    return {
      mapMarkers: [],
      mapLines: [],
      updateMode: 'center',
      hillCount: 10,
      updateModes: [
        { text: 'Center of  map', value: 'center', icon: BIconArrowsMove },
        { text: 'Click', value: 'click', icon: BIconHandIndex },
        { text: 'Follow mouse', value: 'mouse', icon: BIconCursor }
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
      const types = this.hillTypes.filter(ht => ht.state).map(ht => ht.name)
      return allHills.filter(h => types.includes(h.type))
    },
    features: function () {
      return featureCollection([...this.hills.map(h => point([h.lat, h.lng], { name: h.name }))])
    }
  },
  watch: {
    hills: function () {
      this.updateMarkers()
      this.updateLines()
    },
    updateMode: function (newValue) {
      this.map.off('move', this.debouncer)
      this.map.off('click', this.updateLines)
      this.map.off('mousemove', this.updateLines)

      if (newValue === 'center') {
        this.map.on('move', this.debouncer)
      } else if (newValue === 'click') {
        this.map.on('click', this.updateLines)
      } else if (newValue === 'mouse') {
        this.map.on('mousemove', this.updateLines)
      }

      this.updateLines()
    },
    hillCount: function () {
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
      this.mapMarkers.forEach(m => this.map.removeLayer(m))

      this.mapMarkers = this.hills.map(h => {
        const color = this.hillTypes.find(ht => ht.name === h.type).color
        const marker = L.circleMarker([h.lat, h.lng], {
          stroke: false,
          radius: 4,
          fillOpacity: 0.75,
          fillColor: color
        }).bindPopup(h.name)

        marker.addTo(this.map)

        return marker
      })

      if (updateBounds) {
        const bounds = L.latLngBounds()

        this.mapMarkers.forEach(m => bounds.extend(m.getLatLng()))

        if (bounds.isValid()) {
          this.map.fitBounds(bounds.pad(0.1))
        }
      }
    },
    updateLines: function (e) {
      this.mapLines.forEach(l => this.map.removeLayer(l))

      let center

      if (this.updateMode === 'center') {
        center = point([this.map.getCenter().lat, this.map.getCenter().lng])
      } else if (this.updateMode === 'click' || this.updateMode === 'mouse') {
        if (!e) {
          return
        }

        center = point([e.latlng.lat, e.latlng.lng])
      }

      const coll = JSON.parse(JSON.stringify(this.features))
      const nearestList = []

      for (let i = 0; i < this.hillCount; i++) {
        const nearest = nearestPoint(center, coll)
        const dist = distance(center, nearest)

        nearestList.push({ point: nearest.geometry.coordinates, dist: dist })

        const index = coll.features.findIndex(n => n.properties.name === nearest.properties.name)
        if (index !== -1) {
          coll.features.splice(index, 1)
        }
      }

      this.mapLines = nearestList.map((n, i) => {
        const line = L.polyline([center.geometry.coordinates, n.point], {
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
    this.map.on('move', this.debouncer)

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
