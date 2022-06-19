<template>
  <div id="map">
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
      hillType: 'munro',
      mapMarkers: [],
      mapLines: []
    }
  },
  computed: {
    hills: function () {
      return allHills.filter(h => h.type === this.hillType)
    },
    features: function () {
      return featureCollection([...this.hills.map(h => point([h.lat, h.lng], { name: h.name }))])
    }
  },
  watch: {
    hills: function () {
      this.updateHills()
    },
    mapMarkers: function (newValue) {
      const bounds = L.latLngBounds()

      newValue.forEach(m => bounds.extend(m.getLatLng()))

      if (bounds.isValid()) {
        this.map.fitBounds(bounds.pad(0.1))
      }
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
    updateMarkers: function () {
      this.mapMarkers.forEach(m => this.map.removeLayer(m))

      this.mapMarkers = this.hills.map(h => {
        const marker = L.circleMarker([h.lat, h.lng], {
          stroke: false,
          radius: 5,
          fillOpacity: 1,
          fillColor: '#1289A7'
        }).bindPopup(h.name)

        marker.addTo(this.map)

        return marker
      })
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
    // this.map.on('move', () => {
    //   this.updateLines()
    // })
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

    this.updateMarkers()
  }
}
</script>

<style scoped>
#map {
  height: 100vh;
}
</style>
