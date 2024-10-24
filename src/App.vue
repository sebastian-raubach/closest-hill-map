<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="primary">
      <b-navbar-brand :to="{ name: 'home' }">
        <img src="/img/logo.svg" height="30px" class="d-inline-block align-top me-3" alt="Closest Hill Map" >
         ClosestHillMap
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item :to="{ name: 'home' }">Home</b-nav-item>
          <b-nav-item :to="{ name: 'about' }">About</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <router-view class="mt-3"/>
  </div>
</template>

<style lang="scss">
$primary: #2980b9;

@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-vue/src/index.scss';
</style>
