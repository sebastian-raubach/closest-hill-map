<template>
  <div>
    <b-container>
      <b-jumbotron class="mb-3" header="Closest Hill Map" lead="Find the 10 closest hills to the center of the map.">
        <b-button variant="primary" :to="{ name: 'about' }">Find out more</b-button>
      </b-jumbotron>
      <div class="text-center mb-3">
        <b-button-group>
          <b-button
            v-for="hill in hillTypes"
            :key="`hill-type-${hill.name}`"
            :pressed.sync="hill.state"><span :style="{ color: hill.state ? hill.color : '#999' }">⬤</span> <span class="hill-name">{{ hill.name }}</span></b-button>
        </b-button-group>
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

const gradient = tinygradient(['#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'])
const allHills = require('@/assets/hills.json')

export default {
  data: function () {
    return {
      mapMarkers: [],
      mapLines: [],
      hillTypes: [
        { name: 'munro', color: '#eb3b5a', state: true },
        { name: 'corbett', color: '#fa8231', state: true },
        { name: 'graham', color: '#20bf6b', state: true },
        { name: 'donald', color: '#0fb9b1', state: true }
      ]
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
    updateLines: function () {
      this.mapLines.forEach(l => this.map.removeLayer(l))

      const center = point([this.map.getCenter().lat, this.map.getCenter().lng])

      const coll = JSON.parse(JSON.stringify(this.features))
      const nearestList = []

      for (let i = 0; i < 10; i++) {
        const nearest = nearestPoint(center, coll)
        const dist = distance(center, nearest)

        const startLng = center.geometry.coordinates[0]
        const endLng = nearest.geometry.coordinates[0]

        if (startLng >= 90 && endLng <= -90) {
          nearest.geometry.coordinates[0] += 360
        } else if (startLng <= -90 && endLng >= 90) {
          nearest.geometry.coordinates[0] -= 360
        }

        nearestList.push({ point: nearest.geometry.coordinates, dist: dist })

        const index = coll.features.findIndex(n => n.properties.name === nearest.properties.name)
        if (index !== -1) {
          coll.features.splice(index, 1)
        }
      }

      this.mapLines = nearestList.map((n, i) => {
        const line = L.polyline([center.geometry.coordinates, n.point], {
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
    this.map.on('move', this.debounce(() => this.updateLines()))

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
