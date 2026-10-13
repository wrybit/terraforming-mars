<template>
  <!-- Admin login: the passphrase goes to the server once (POST), the browser then keeps a login cookie.
       Three groups with more space between than within: who, what to enter, the field with its button -->
  <form class="games-overview-card admin-login-card" @submit.prevent="open">
    <div class="admin-login-title">
      <h1>{{ APP_NAME }}</h1>
      <span v-i18n>Administration</span>
    </div>
    <div class="admin-login-explanation">
      <p class="admin-login-text" :class="{'admin-login-text--error': outcome !== 'none'}" v-i18n>{{ message }}</p>
      <p class="admin-login-hint" v-i18n>It is the value of SERVER_ID in the .env file of the server.</p>
    </div>
    <div class="admin-login-fields">
      <RevealablePasswordInput v-model="serverId" inputClass="admin-login-input" autofocus :ariaLabel="$t('Server ID')" :placeholder="$t('Server ID')"/>
      <!-- After a failure the button counts down until the server accepts the next attempt -->
      <button type="submit" class="btn btn-primary admin-login-button" :disabled="serverId.trim() === '' || busy || waitSeconds > 0">
        <span v-if="waitSeconds > 0" class="admin-login-countdown">{{ countdown }}</span>
        <span v-else v-i18n>Open</span>
      </button>
    </div>
  </form>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {logIn} from '@/client/components/admin/adminSession';
import {APP_NAME} from '@/common/constants';
import RevealablePasswordInput from '@/client/components/common/RevealablePasswordInput.vue';

type Outcome = 'none' | 'wrong' | 'locked';

const MESSAGES: Record<Outcome, string> = {
  none: 'Enter the server ID to open the administration of this server.',
  wrong: 'This server ID does not seem to fit. Please check it or enter it again.',
  locked: 'Too many wrong attempts. Please wait until the countdown has run out.',
};

export default defineComponent({
  name: 'ServerIdPrompt',
  components: {RevealablePasswordInput},
  emits: ['opened'],
  data() {
    return {APP_NAME, serverId: '', outcome: 'none' as Outcome, busy: false, waitSeconds: 0, timer: undefined as number | undefined};
  },
  computed: {
    message(): string {
      return MESSAGES[this.outcome];
    },
    // Minutes and seconds (0:08, 14:59): reads the same in every language
    countdown(): string {
      const minutes = Math.floor(this.waitSeconds / 60);
      const seconds = this.waitSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    },
  },
  beforeUnmount() {
    window.clearInterval(this.timer);
  },
  methods: {
    async open(): Promise<void> {
      this.busy = true;
      try {
        const result = await logIn(this.serverId.trim());
        if (result.outcome === 'admin') {
          this.$emit('opened');
          return;
        }
        this.outcome = result.outcome;
        this.startCountdown(result.retryAfterSeconds);
      } catch {
        this.outcome = 'wrong';
      } finally {
        this.busy = false;
      }
    },
    startCountdown(seconds: number): void {
      window.clearInterval(this.timer);
      this.waitSeconds = seconds;
      if (seconds <= 0) {
        return;
      }
      this.timer = window.setInterval(() => {
        this.waitSeconds--;
        if (this.waitSeconds <= 0) {
          window.clearInterval(this.timer);
        }
      }, 1000);
    },
  },
});
</script>
