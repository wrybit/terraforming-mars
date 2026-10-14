<template>
   <!-- log-line--<colour>: text and hover in the colour of the player the line is about (log.less) -->
   <li v-if="message !== undefined && message.data !== undefined && message.message !== undefined"
     :class="[lineColor !== undefined ? 'log-line--' + lineColor : '', {'log-line--expandable': expandable, 'log-line--ai-insight': message.aiInsight !== undefined, 'log-line--discard': isDiscard}]"
     @click.prevent="$emit('click')">
    <span v-if="(message.type ?? LogMessageType.DEFAULT) === LogMessageType.DEFAULT" :title="when" v-html="icon"></span>
    <!-- Analysis game: a private line of an AI player, normally hidden from the others (after the time icon, which the log hides) -->
    <span v-if="message.aiInsight !== undefined" class="log-ai-insight" :title="$t('Visible because this is an analysis game')"><SeatIcon kind="ai" :size="14"/></span>
    <template v-for="(data, idx) of entries" :key="idx">
      <span class="log-plain-text" v-if="typeof(data) === 'string'">{{ data }}</span>
      <span v-else>
        <span v-if="data.type === undefined || data.value === undefined"></span>
        <span v-else-if="data.type === LogMessageDataType.PLAYER" class="log-player" :class="'player_bg_color_' + data.value"> {{ getPlayerName(data.value) }} </span>
        <span v-else-if="data.type === LogMessageDataType.CARD" v-html="cardToHtml(data)"></span>
        <span v-else-if="data.type === LogMessageDataType.GLOBAL_EVENT" class="log-card background-color-global-event" v-i18n>
          {{data.value}}
        </span>
        <span v-else-if="data.type === LogMessageDataType.TILE_TYPE" v-i18n>
          {{tileTypeToString[data.value]}}
        </span>
        <span v-else-if="data.type === LogMessageDataType.PARTY" class="log-row-party">
          <i :class="['log-row-party-icon', 'log-row-party-icon--' + partySlug(data.value)]"></i>{{ $t(data.value) }}
        </span>
        <span v-else-if="data.type === LogMessageDataType.COLONY" class="log-card background-color-colony" v-i18n>
          {{data.value}}
        </span>
        <span v-else-if="data.type === LogMessageDataType.UNDERGROUND_TOKEN" class="log-excavation-token" v-i18n>
          {{undergroundResourceTokenDescription[data.value]}}
        </span>
        <LogSpaceChip v-else-if="data.type === LogMessageDataType.SPACE" :space="data.value" :game="viewModel.game" @spaceClicked="$emit('spaceClicked', $event)"/>
        <span v-else-if="data.type === LogMessageDataType.CARDS" v-html="cardsToHtml(data)"></span>

        <!-- Game id at the end of the game: link to the results page -->
        <a v-else-if="data.type === LogMessageDataType.RAW_STRING && resultsLink !== undefined" :href="resultsLink" class="log-results-link" @click.stop>{{ data.value }}</a>
        <span v-else-if="data.type === LogMessageDataType.RAW_STRING">{{ data.value }}</span>
        <span v-else v-i18n>{{ data.value }}</span>
      </span>
    </template>
   </li>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {Color} from '@/common/Color';
import {CardName} from '@/common/cards/CardName';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageData, LogMessageDataAttrs} from '@/common/logs/LogMessageData';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ViewModel} from '@/common/models/PlayerModel';
import {tileTypeToString} from '@/common/TileType';
import {Log} from '@/common/logs/Log';
import {getCard} from '@/client/cards/ClientCardManifest';
import {undergroundResourceTokenDescription} from '@/common/underworld/UndergroundResourceToken';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {gameLocaleToIntlLocale} from '@/client/utils/LocaleUtils';
import {range} from '@/common/utils/utils';
import {needsModalPreview} from '@/client/components/logpanel/logMessageContent';
import {cardTypeToCss, partySlug} from '@/client/components/logpanel/logCardType';
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import LogSpaceChip from '@/client/components/logpanel/LogSpaceChip.vue';

const DISCARD_MESSAGES = new Set([
  '${0} discarded ${1}',
  'You discarded ${0}',
  'You drew and discarded ${0}',
  'Discarding ${0} as you could not play it.',
]);


export default defineComponent({
  name: 'LogMessageComponent',
  components: {
    SeatIcon,
    LogSpaceChip,
  },
  props: {
    message: {
      type: Object as () => LogMessage,
      required: true,
    },
    viewModel: {
      type: Object as () => ViewModel,
      required: true,
    },
  },
  methods: {
    partySlug,
    cardToHtml(data: LogMessageData & {type: LogMessageDataType.CARD, value: CardName}) {
      return this.innerCardToHtml(data.value, data.attrs);
    },
    cardsToHtml(data: LogMessageData & {type: LogMessageDataType.CARDS, value: ReadonlyArray<CardName>}) {
      if (data.attrs?.ellipsis) {
        return '<span class="log-card background-color-standard-project">...</span>';
      }
      const cardHtmls = data.value.map((cardName) => this.innerCardToHtml(cardName, data.attrs));
      const htmlsAsIndexes = range(cardHtmls.length).map(String);
      // These parts will be either type 'element', or type 'literal'.
      // The 'element' parts represent the indexes of the cards (which will be filled in later)
      // The 'literal' parts represent the text that combines everything together.
      //
      // So for English, if the cards are Algae , Birds, and Celestic, it returns
      // ["Algae, ", "Birds, ", "and ", "Celestic"] with types ["element", "element", "literal", "element"]
      //
      // The tests show what this produces.
      const parts = this.formatter.formatToParts(htmlsAsIndexes);
      return parts
        .map((part) => part.type === 'element' ? cardHtmls[Number(part.value)] : part.value)
        .join('');
    },
    innerCardToHtml(cardName: CardName, attrs?: LogMessageDataAttrs) {
      const card = getCard(cardName);
      if (card === undefined) {
        return '';
      }

      const suffixFreeCardName = card.name.split(':')[0];
      const className = cardTypeToCss[card.type];

      if (className === undefined) {
        return suffixFreeCardName;
      }
      let tagHTML = '';
      if (attrs?.tags === true) {
        tagHTML = '&nbsp;' + (card.tags.map((tag) => `<div class="log-tag tag-${tag}"></div>`).join(' '));
      }

      let costHTML = '';
      if (attrs?.cost === true) {
        costHTML = `<span>&nbsp;<div class="log-resource-megacredits">${card.cost}</div></span>`;
      }
      return '<span class="log-card '+ className + '">' + this.$t(suffixFreeCardName) + tagHTML + costHTML +'</span>';
    },
    getPlayerName(color: Color) {
      const player = this.viewModel.players.find((player) => player.color === color);
      return player?.name ?? color;
    },
  },
  computed: {
    // Player of the line = first player entry of the message (e.g. "${0} played …")
    // Many cards: opens a modal on click (see logMessageContent.ts)
    expandable(): boolean {
      return needsModalPreview(this.message);
    },
    // Lines about discarded cards: their card names show in red (log.less)
    isDiscard(): boolean {
      return DISCARD_MESSAGES.has(this.message.message);
    },
    lineColor(): Color | undefined {
      const player = this.message.data?.find((datum) => datum.type === LogMessageDataType.PLAYER);
      return player?.value as Color | undefined;
    },
    entries() {
      if (this.message === undefined) {
        return [];
      }
      const e = {
        message: this.$t(this.message.message),
        data: this.message.data,
      };
      return Log.parse(e);
    },
    // Results page of the viewer (player or spectator id), shown for the last line of a finished game
    resultsLink(): string | undefined {
      return this.message.message === 'This game id was ${0}' && this.viewModel.id !== undefined ? 'the-end?id=' + this.viewModel.id : undefined;
    },
    when() {
      return new Date(this.message.timestamp).toLocaleString();
    },
    icon() {
      return this.message.playerId === undefined && this.message.aiInsight === undefined ? '&#x1f551;' : '&#x1f4ac;';
    },
    LogMessageType(): typeof LogMessageType {
      return LogMessageType;
    },
    LogMessageDataType(): typeof LogMessageDataType {
      return LogMessageDataType;
    },
    undergroundResourceTokenDescription(): typeof undergroundResourceTokenDescription {
      return undergroundResourceTokenDescription;
    },
    tileTypeToString(): typeof tileTypeToString {
      return tileTypeToString;
    },
    formatter(): Intl.ListFormat {
      return new Intl.ListFormat(gameLocaleToIntlLocale(getPreferences().lang), {type: 'conjunction', style: 'long'});
    },
  },
});
</script>
