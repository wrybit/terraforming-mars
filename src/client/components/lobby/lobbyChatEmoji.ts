// Emojis of the chat's emoji popover (LobbyChat.vue) in groups, and the check for messages that are only emojis

/** An emoji with its short name, written :name: in a message (the usual names of chat portals) */
export type ChatEmoji = {emoji: string, name: string};

/** One heading of the popover with its emojis; the title is an English text key (translated in the popover) */
export type ChatEmojiGroup = {title: string, emojis: ReadonlyArray<ChatEmoji>};

// "😀 grinning|😃 smiley|…": compact to write, read into ChatEmoji
function emojiList(list: string): ReadonlyArray<ChatEmoji> {
  return list.split('|').map((entry) => {
    const [emoji, name] = entry.split(' ');
    return {emoji, name};
  });
}

// Rows of seven in the popover: every group fills whole rows
export const CHAT_EMOJI_GROUPS: ReadonlyArray<ChatEmojiGroup> = [
  {title: 'Faces', emojis: emojiList(
    '😀 grinning|😃 smiley|😄 smile|😁 grin|😆 laughing|😂 joy|🤣 rofl|' +
    '😅 sweat_smile|😊 blush|😇 innocent|🙂 slightly_smiling_face|😉 wink|😍 heart_eyes|🥰 smiling_face_with_hearts|' +
    '😘 kissing_heart|😋 yum|😜 stuck_out_tongue_winking_eye|🤪 zany_face|😎 sunglasses|🤓 nerd_face|🤗 hugs|' +
    '🤔 thinking|🤨 raised_eyebrow|😐 neutral_face|😶 no_mouth|🙄 roll_eyes|😏 smirk|😬 grimacing|' +
    '😮 open_mouth|😲 astonished|😳 flushed|🥺 pleading_face|😢 cry|😭 sob|😤 triumph|' +
    '😡 rage|🤬 cursing_face|🤯 exploding_head|😱 scream|😴 sleeping|🥱 yawning_face|🤐 zipper_mouth_face'),
  },
  {title: 'Gestures', emojis: emojiList(
    '👍 thumbsup|👎 thumbsdown|👏 clap|🙌 raised_hands|🙏 pray|💪 muscle|👋 wave|' +
    '🤝 handshake|👌 ok_hand|✌️ v|🤞 crossed_fingers|🤟 love_you_gesture|🤘 metal|👊 punch|' +
    '✊ fist_raised|🫡 saluting_face|👉 point_right|👈 point_left|👆 point_up|👇 point_down|🫶 heart_hands'),
  },
  {title: 'Celebration', emojis: emojiList(
    '🎉 tada|🎊 confetti_ball|🥳 partying_face|🎈 balloon|🎁 gift|🏆 trophy|🥇 1st_place_medal|' +
    '🥈 2nd_place_medal|🥉 3rd_place_medal|🏅 medal_sports|🎖️ medal_military|👑 crown|💯 100|✨ sparkles'),
  },
  {title: 'Space', emojis: emojiList(
    '🚀 rocket|🛸 flying_saucer|🛰️ artificial_satellite|🪐 ringed_planet|🌍 earth_africa|🌎 earth_americas|🌏 earth_asia|' +
    '🌑 new_moon|🌕 full_moon|🌙 crescent_moon|☀️ sunny|⭐ star|🌟 star2|💫 dizzy|' +
    '☄️ comet|🌌 milky_way|🔭 telescope|👽 alien|👾 space_invader|🧑‍🚀 astronaut|🌋 volcano'),
  },
  {title: 'Nature', emojis: emojiList(
    '🌱 seedling|🌿 herb|🍀 four_leaf_clover|🌳 deciduous_tree|🌲 evergreen_tree|🌴 palm_tree|🌵 cactus|' +
    '🌾 ear_of_rice|🌻 sunflower|🌸 cherry_blossom|🍄 mushroom|🦠 microbe|🐛 bug|🐝 bee|' +
    '🐟 fish|🐸 frog|🐾 paw_prints|💧 droplet|🌊 ocean|🔥 fire|❄️ snowflake|' +
    '🌡️ thermometer|⚡ zap|🌪️ tornado|🌈 rainbow|☁️ cloud|🌧️ cloud_with_rain|🏔️ mountain_snow'),
  },
  {title: 'Food & drink', emojis: emojiList(
    '☕ coffee|🍵 tea|🍺 beer|🍻 beers|🍷 wine_glass|🥂 clinking_glasses|🍾 champagne|' +
    '🍕 pizza|🍔 hamburger|🍟 fries|🌮 taco|🍿 popcorn|🍩 doughnut|🍪 cookie|' +
    '🍫 chocolate_bar|🍰 cake|🍎 apple|🍌 banana|🥕 carrot|🥔 potato|🧀 cheese'),
  },
  {title: 'Objects', emojis: emojiList(
    '🎲 game_die|♟️ chess_pawn|🃏 black_joker|🧩 jigsaw|🎮 video_game|⏳ hourglass_flowing_sand|⌛ hourglass|' +
    '⏰ alarm_clock|💰 moneybag|💎 gem|🔧 wrench|🔨 hammer|⚙️ gear|🧪 test_tube|' +
    '🏭 factory|🏙️ cityscape|🏗️ building_construction|🏛️ classical_building|⚓ anchor|📈 chart_with_upwards_trend|📉 chart_with_downwards_trend'),
  },
  {title: 'Symbols', emojis: emojiList(
    '❤️ heart|🧡 orange_heart|💛 yellow_heart|💚 green_heart|💙 blue_heart|💜 purple_heart|🖤 black_heart|' +
    '🤍 white_heart|💔 broken_heart|❣️ heavy_heart_exclamation|✅ white_check_mark|❌ x|❓ question|❗ exclamation|' +
    '⚠️ warning|🚫 no_entry_sign|💤 zzz|💬 speech_balloon|👀 eyes|🆗 ok|🔝 top'),
  },
];

const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;

/** Characters as people see them (an emoji with skin tone or a family is one); without Segmenter: code points */
function graphemes(text: string): Array<string> {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

/** A message of only 1 to 3 emojis (spaces aside) is shown large, like a reaction */
export function isEmojiOnly(text: string): boolean {
  const characters = graphemes(text.replace(/\s+/g, ''));
  return characters.length >= 1 && characters.length <= 3 && characters.every((character) => PICTOGRAPHIC.test(character));
}
