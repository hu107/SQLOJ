<script setup>
import BrandLogo from '../components/BrandLogo.vue'
</script>

<template>
  <div class="auth-page">
    <header class="auth-header">
      <RouterLink class="brand" to="/login" aria-label="SQLOJ 首页"><BrandLogo /></RouterLink>
      <span class="header-caption">SQLOJ 管理端</span>
    </header>
    <main class="auth-main">
      <section class="auth-intro">
        <span class="eyebrow">SQLOJ CONSOLE</span>
        <h1>每一道好题，<br />都值得<span>用心管理。</span></h1>
        <p>集中查看 SQL 题目信息。<br />让题库清晰，让内容有序。</p>
      </section>
      <section class="auth-card"><slot /></section>
    </main>
    <footer class="auth-footer">SQLOJ · 题库管理</footer>
  </div>
</template>
