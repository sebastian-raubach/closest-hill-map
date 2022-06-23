<template>
  <b-modal title="Import data"
           ok-title="Import"
           @ok.prevent="onSubmit"
           @shown="$refs.input.focus()"
           size="lg"
           ref="dataImportModal">
    <b-form @submit.prevent="onSubmit">
      <b-form-group label="Input" label-for="input" description="Provide custom input in tab-delimited form. Columns must include 'name', 'lat', and 'lng'.">
        <b-form-textarea id="input" :state="state" ref="input" :rows="5" :placeholder="'name\tlat\tlng\nPlace1\t56.749\t-3.667\nPlace2\t56.741\t-3.167'" v-model="input" />
        <b-form-invalid-feedback :state="state">
          Invalid input format. Please make sure you included the required columns and your data is tab-delimited.
        </b-form-invalid-feedback>
      </b-form-group>
    </b-form>
  </b-modal>
</template>

<script>
export default {
  data: function () {
    return {
      input: null,
      state: null
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$nextTick(() => this.$refs.dataImportModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.input = null
      this.$nextTick(() => this.$refs.dataImportModal.hide())
    },
    onSubmit: function () {
      this.state = null

      try {
        const lines = this.input.split(/\r?\n/).filter(l => l !== undefined && l !== null && l !== '').map(l => l.split('\t'))

        if (!lines[0].includes('name') || !lines[0].includes('lat') || !lines[0].includes('lng')) {
          this.state = false
          return
        }

        const json = this.tsvJSON(lines)
        json.forEach(l => {
          l.lat = +l.lat
          l.lng = +l.lng
        })

        this.$emit('data-loaded', json)
        this.hide()
      } catch (err) {
        this.state = false
      }
    },
    tsvJSON: function (lines) {
      const result = []
      const headers = lines[0]

      for (let i = 1; i < lines.length; i++) {
        const obj = {}
        const currentLine = lines[i]

        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentLine[j]
        }

        result.push(obj)
      }

      return result
    }
  }
}
</script>

<style>

</style>
