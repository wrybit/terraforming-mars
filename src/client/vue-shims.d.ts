declare module '*.vue' {
  import {DefineComponent} from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Stylesheets imported by TypeScript (e.g. by optional extensions); webpack's less-loader injects them
declare module '*.less';
