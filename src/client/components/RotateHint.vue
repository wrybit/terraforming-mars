<!-- Handy quer: zu wenig Höhe für Spielplan und Fußleiste. Statt einer gequetschten Ansicht die Bitte,
     das Gerät hochkant zu drehen – nur als Bild (Handy + Drehpfeil), damit nichts übersetzt werden muss.
     Sichtbar schaltet allein rotate_hint.less (Touch, quer, flach). -->
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
