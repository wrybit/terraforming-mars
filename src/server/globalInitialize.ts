import {installAiDriver} from './ai/aiDriver';
import {installRustAi} from './ai/rust/installRustAi';
import {registerBehaviorExecutor} from './behavior/BehaviorExecutor';
import {Executor} from './behavior/Executor';
import {initializeGlobalEventDealer} from './turmoil/globalEvents/GlobalEventDealer';
import {ALL_MODULE_MANIFESTS} from './cards/AllManifests';

export function globalInitialize() {
  registerBehaviorExecutor(new Executor());
  initializeGlobalEventDealer(ALL_MODULE_MANIFESTS);
  installAiDriver();
  installRustAi();
}
