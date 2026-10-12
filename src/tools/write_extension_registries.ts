// npm run make:extensions – see make_extensions.ts
import {copyExtensionAssets, extensionNames, writeExtensionRegistries} from './make_extensions';

writeExtensionRegistries();
copyExtensionAssets();
console.log(`Extensions: ${extensionNames().join(', ') || 'none'}`);
