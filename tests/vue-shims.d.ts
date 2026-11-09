declare module '*.vue' {
  import {DefineComponent} from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Stylesheets imported by TypeScript (e.g. by optional extensions), as in src/client/vue-shims.d.ts
declare module '*.less';
