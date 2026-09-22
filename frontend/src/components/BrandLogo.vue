<template>
  <span class="brand-logo">
    <img class="brand-mark" src="/sqloj-mark.svg" alt="" width="40" height="40" />
    <span class="brand-wordmark">SQL<span>OJ</span></span>
  </span>
</template>

<style scoped>
.brand-logo { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.brand-mark { display: block; width: 38px; height: 38px; flex-shrink: 0; }
.brand-wordmark { font-family: 'Segoe UI', Arial, sans-serif; font-size: 25px; font-weight: 650; letter-spacing: -1.1px; color: #263d36; line-height: 1; }
.brand-wordmark > span { color: #12a97c; font-weight: 450; }
@media (max-width: 600px) {
  .brand-mark { width: 32px; height: 32px; }
  .brand-logo { gap: 5px; }
  .brand-wordmark { font-size: 22px; }
}
</style>
