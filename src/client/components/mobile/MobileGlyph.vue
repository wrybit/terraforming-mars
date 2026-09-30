<template>
  <svg class="mb-glyph" viewBox="0 0 24 24" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- Outline für inaktive, gefüllte Form für aktive Einträge; Farbe kommt über currentColor (mobile.less) -->
    <g v-for="(layer, index) in glyph.layers" :key="index">
      <!-- Gefüllt: vordere Ebenen bekommen einen Spalt, damit sich die Formen nicht zu einer Fläche verbinden -->
      <g v-if="filled && index > 0" class="mb-glyph-gap">
        <component :is="shape.tag" v-for="(shape, shapeIndex) in layer" :key="shapeIndex" v-bind="shape.attributes"/>
      </g>
      <g :class="layerClass(index)">
        <component :is="shape.tag" v-for="(shape, shapeIndex) in layer" :key="shapeIndex" v-bind="shape.attributes"/>
      </g>
    </g>
    <g :class="filled ? 'mb-glyph-cut' : 'mb-glyph-line'">
      <component :is="shape.tag" v-for="(shape, shapeIndex) in glyph.details" :key="shapeIndex" v-bind="shape.attributes"/>
    </g>
  </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {GLYPHS, Glyph, GlyphName} from '@/client/components/mobile/mobileGlyphs';

export default defineComponent({
  name: 'MobileGlyph',
  props: {
    name: {
      type: String as PropType<GlyphName>,
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
    glyph(): Glyph {
      return GLYPHS[this.name];
    },
  },
  methods: {
    layerClass(index: number): string {
      if (this.filled) {
        return 'mb-glyph-fill';
      }
      // Outline: vordere Ebenen decken ab, damit Linien der hinteren Ebene nicht durchscheinen
      return index > 0 ? 'mb-glyph-cover' : 'mb-glyph-line';
    },
  },
});
</script>
