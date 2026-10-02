<!-- Phone in landscape: too little height for the board and footer. Instead of a squeezed view, the request
     to rotate the device to portrait – as an image only (phone + rotation arrow), so nothing needs translating.
     Visibility is controlled solely by rotate_hint.less (touch, landscape, short). -->
<template>
  <div class="rotate-hint">
    <svg class="rotate-hint__icon" width="120" height="120" viewBox="0 0 96 96" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <g class="rotate-hint__phone">
        <rect x="36" y="22" width="24" height="44" rx="4"/>
        <path d="M45 60h6"/>
      </g>
      <g class="rotate-hint__arrow">
        <path d="M14.1 58A36 36 0 0 0 81.9 58"/>
        <path d="M73.9 64L81.9 58L84.8 67.6"/>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
</script>
