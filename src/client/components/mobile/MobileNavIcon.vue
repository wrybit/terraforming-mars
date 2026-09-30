<template>
  <svg class="mb-nav-icon" viewBox="0 0 24 24" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- Outline für inaktive, gefüllte Form für aktive Einträge; Farbe kommt über currentColor (mobile.less) -->
    <g v-for="(layer, index) in glyph.layers" :key="index">
      <!-- Gefüllt: vordere Ebenen bekommen einen Spalt, damit sich die Formen nicht zu einer Fläche verbinden -->
      <g v-if="filled && index > 0" class="mb-nav-icon-gap">
        <component :is="shape.tag" v-for="(shape, shapeIndex) in layer" :key="shapeIndex" v-bind="shape.attributes"/>
      </g>
      <g :class="layerClass(index)">
        <component :is="shape.tag" v-for="(shape, shapeIndex) in layer" :key="shapeIndex" v-bind="shape.attributes"/>
      </g>
    </g>
    <g :class="filled ? 'mb-nav-icon-cut' : 'mb-nav-icon-line'">
      <component :is="shape.tag" v-for="(shape, shapeIndex) in glyph.details" :key="shapeIndex" v-bind="shape.attributes"/>
    </g>
  </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {NAV_GLYPHS, NavGlyph, NavGlyphName} from '@/client/components/mobile/mobileNavGlyphs';

export default defineComponent({
  name: 'MobileNavIcon',
  props: {
    name: {
      type: String as PropType<NavGlyphName>,
      required: true,
    },
    filled: {
      type: Boolean,
      default: false,
    },
    strokeWidth: {
      type: Number,
      default: 1.8,
    },
  },
  computed: {
    glyph(): NavGlyph {
      return NAV_GLYPHS[this.name];
    },
  },
  methods: {
    layerClass(index: number): string {
      if (this.filled) {
        return 'mb-nav-icon-fill';
      }
      // Outline: vordere Ebenen decken ab, damit Linien der hinteren Ebene nicht durchscheinen
      return index > 0 ? 'mb-nav-icon-cover' : 'mb-nav-icon-line';
    },
  },
});
</script>
