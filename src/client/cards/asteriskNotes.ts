// Card texts whose "*" rule is shown as a separate, highlighted note (format: splitAsteriskNote.ts).
// Keyed by the card's original English text, so the card files stay untouched for upstream merges:
// when upstream rewords a text, its entry no longer matches and the card falls back to the plain
// text. tests/client/cards/asteriskNotes.spec.ts reports such stale entries.
export const ASTERISK_NOTES: Readonly<Record<string, string>> = {
  // Mangrove
  'Requires +4 C or warmer. Place a greenery tile ON AN AREA RESERVED FOR OCEAN and raise oxygen 1 step. Disregard normal placement restrictions for this.':
    'Requires +4 C or warmer. Raise oxygen 1 step. Disregard normal placement restrictions for this.<note>Place a greenery tile <b>on an area reserved for ocean</b>.</note>',
  // Natural Preserve
  'Oxygen must be 4% or less. Place this tile NEXT TO NO OTHER TILE. Increase your M€ production 1 step.':
    'Oxygen must be 4% or less. Increase your M€ production 1 step.<note>Place this tile <b>next to no other tile</b>.</note>',
  // Research Outpost
  'Place a city tile NEXT TO NO OTHER TILE.':
    '<note>Place a city tile <b>next to no other tile</b>.</note>',
  // Imported Hydrogen
  'Gain 3 plants, or add 3 microbes or 2 animals to ANOTHER card. Place an ocean tile.':
    'Place an ocean tile.<note>Gain 3 plants, or add 3 microbes or 2 animals <b>to another card</b>.</note>',
  // Noctis City
  'Decrease your energy production 1 step and increase your M€ production 3 steps. Place a city tile ON THE RESERVED AREA, disregarding normal placement restrictions.':
    'Decrease your energy production 1 step and increase your M€ production 3 steps. Disregard normal placement restrictions for this.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Martian Rails
  'Action: Spend 1 energy to gain 1 M€ for each city tile ON MARS.':
    '<note>Action: Spend 1 energy to gain 1 M€ for each city tile <b>on Mars</b>.</note>',
  // Urbanized Area
  'Decrease your energy production 1 step and increase your M€ production 2 steps. Place a city tile ADJACENT TO AT LEAST 2 OTHER CITY TILES.':
    'Decrease your energy production 1 step and increase your M€ production 2 steps.<note>Place a city tile <b>adjacent to at least 2 other city tiles</b>.</note>',
  // Aerobraked Ammonia Asteroid
  'Increase your heat production 3 steps and your plant production 1 step. Add 2 microbes to ANOTHER card.':
    'Increase your heat production 3 steps and your plant production 1 step.<note>Add 2 microbes <b>to another card</b>.</note>',
  // Artificial Lake
  'Requires -6 C or warmer. Place 1 ocean tile ON AN AREA NOT RESERVED FOR OCEAN.':
    'Requires -6 C or warmer.<note>Place 1 ocean tile <b>on an area not reserved for ocean</b>.</note>',
  // Ecological Zone
  'Requires that YOU have a greenery tile. Place this tile adjacent to ANY greenery.':
    'Requires that you have a greenery tile.<note>Place this tile <b>adjacent to any greenery</b>.</note>',
  // Eos Chasma National Park
  'Requires -12 C or warmer. Add 1 animal TO ANY ANIMAL CARD. Gain 3 plants. Increase your M€ production 2 steps.':
    'Requires -12 C or warmer. Gain 3 plants. Increase your M€ production 2 steps.<note>Add 1 animal <b>to any animal card</b>.</note>',
  // Extreme-Cold Fungus
  'Action: Gain 1 plant, or add 2 microbes to ANOTHER card.':
    '<note>Action: Gain 1 plant, or add 2 microbes <b>to another card</b>.</note>',
  // Flooding
  'Place an ocean tile. IF THERE ARE TILES ADJACENT TO THIS OCEAN TILE, YOU MAY REMOVE 4 M€ FROM THE OWNER OF ONE OF THOSE TILES.':
    'Place an ocean tile.<note>If there are tiles <b>adjacent to this ocean tile</b>, you may remove 4 M€ from the owner of one of those tiles.</note>',
  // Ganymede Colony
  'Place a city tile ON THE RESERVED AREA.':
    '<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Imported Nitrogen
  'Raise your TR 1 step and gain 4 plants. Add 3 microbes to ANOTHER card and 2 animals to ANOTHER card.':
    'Raise your TR 1 step and gain 4 plants.<note>Add 3 microbes <b>to another card</b> and 2 animals <b>to another card</b>.</note>',
  // Large Convoy
  'Place an ocean tile and draw 2 cards. Gain 5 plants or add 4 animals to ANOTHER card.':
    'Place an ocean tile and draw 2 cards.<note>Gain 5 plants or add 4 animals <b>to another card</b>.</note>',
  // Lava Flows
  'Raise temperature 2 steps and place this tile ON EITHER THARSIS THOLUS, ASCRAEUS MONS, PAVONIS MONS OR ARSIA MONS.':
    'Raise temperature 2 steps.<note>Place this tile <b>on either Tharsis Tholus, Ascraeus Mons, Pavonis Mons or Arsia Mons</b>.</note>',
  // Local Heat Trapping
  'Spend 5 heat to gain either 4 plants, or to add 2 animals to ANOTHER card.':
    '<note>Spend 5 heat to gain either 4 plants, or to add 2 animals <b>to another card</b>.</note>',
  // Mining Rights
  'Place this tile on an area with a steel or titanium placement bonus. Increase that production 1 step.':
    '<note>Place this tile on an area <b>with a steel or titanium placement bonus</b>. Increase that production 1 step.</note>',
  // Phobos Space Haven
  'Increase your titanium production 1 step and place a city tile ON THE RESERVED AREA.':
    'Increase your titanium production 1 step.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Protected Valley
  'Increase your M€ production 2 steps. Place a greenery tile ON AN AREA RESERVED FOR OCEAN, disregarding normal placement restrictions, and increase oxygen 1 step.':
    'Increase your M€ production 2 steps. Increase oxygen 1 step. Disregard normal placement restrictions for the greenery tile.<note>Place a greenery tile <b>on an area reserved for ocean</b>.</note>',
  // Search For Life
  'Action: Spend 1 M€ to reveal the top card of the draw deck. If that card has a microbe tag, add a science resource here.':
    'Action: Spend 1 M€ to reveal the top card of the draw deck.<note>If that card <b>has a microbe tag</b>, add a science resource here.</note>',
  // Symbiotic Fungus
  'Action: Add a microbe to ANOTHER card.':
    '<note>Action: Add a microbe <b>to another card</b>.</note>',
  // Zeppelins
  'Requires 5% oxygen. Increase your M€ production 1 step for each city tile ON MARS.':
    'Requires 5% oxygen.<note>Increase your M€ production 1 step for each city tile <b>on Mars</b>.</note>',
  // Mining Guild
  'Effect: Each time you place a tile on an area with a steel or titanium placement bonus, increase your steel production 1 step':
    '<note>Effect: Each time you place a tile on an area <b>with a steel or titanium placement bonus</b>, increase your steel production 1 step.</note>',
  // Tharsis Republic
  'Effect: When any city tile is placed ON MARS, increase your M€ production 1 step. When you place a city tile, gain 3 M€.':
    'Effect: When you place a city tile, gain 3 M€.<note>When any city tile is placed <b>on Mars</b>, increase your M€ production 1 step.</note>',
  // ThorGate
  'Effect: When playing a power card OR THE STANDARD PROJECT POWER PLANT, you pay 3 M€ less for it.':
    '<note>Effect: When playing a power card <b>or the standard project power plant</b>, you pay 3 M€ less for it.</note>',
  // United Nations Mars Initiative
  'Action: If your Terraform Rating was raised this generation, you may pay 3 M€ to raise it 1 step more.':
    '<note>Action: If your Terraform Rating <b>was raised this generation</b>, you may pay 3 M€ to raise it 1 step more.</note>',
  // Industrial Center
  'Place this tile adjacent to a city tile.':
    '<note>Place this tile <b>adjacent to a city tile</b>.</note>',
  // Mining Area
  'Place this tile on an area with a steel or titanium placement bonus, adjacent to another of your tiles. Increase your production of that resource 1 step.':
    '<note>Place this tile on an area <b>with a steel or titanium placement bonus</b>, <b>adjacent to another of your tiles</b>. Increase your production of that resource 1 step.</note>',
  // Toll Station
  'Increase your M€ production 1 step for each space tag your OPPONENTS have.':
    '<note>Increase your M€ production 1 step for each space tag <b>your opponents</b> have.</note>',
  // Viral Enhancers
  'Effect: When you play a plant, microbe, or an animal tag, including this, gain 1 plant or add 1 resource to THAT CARD.':
    '<note>Effect: When you play a plant, microbe, or an animal tag, including this, gain 1 plant or add 1 resource <b>to that card</b>.</note>',
  // Hi-Tech Lab
  'Action: Spend any amount of energy to draw the same number of cards. TAKE 1 INTO HAND AND DISCARD THE REST.':
    'Action: Spend any amount of energy to draw the same number of cards.<note><b>Take 1 into hand</b> and discard the rest.</note>',
  // Law Suit
  'Steal 3 M€ from a player that REMOVED YOUR RESOURCES OR DECREASED YOUR PRODUCTION this generation. Place this card face down in THAT PLAYER\'S EVENT PILE.':
    'Place this card face down in that player\'s event pile.<note>Steal 3 M€ from a player that <b>removed your resources or decreased your production</b> this generation.</note>',
  // Stanford Torus
  'Place a city tile IN SPACE, outside and separate from the planet.':
    '<note>Place a city tile <b>in space</b>, outside and separate from the planet.</note>',
  // Asteroid Rights
  'Action: Spend 1 M€ to add 1 asteroid to ANY card OR spend 1 asteroid here to increase M€ production 1 step OR gain 2 titanium.':
    '<note>Action: Spend 1 M€ to add 1 asteroid <b>to any card</b> or spend 1 asteroid here to increase M€ production 1 step or gain 2 titanium.</note>',
  // Comet Aiming
  'Action: Spend 1 titanium to add 1 asteroid resource to ANY CARD, or remove 1 asteroid here to place an ocean.':
    '<note>Action: Spend 1 titanium to add 1 asteroid resource <b>to any card</b>, or remove 1 asteroid here to place an ocean.</note>',
  // Directed Impactors
  'Action: Spend 6 M€ to add 1 asteroid to ANY CARD (titanium may be used to pay for this), or remove 1 asteroid here to raise temperature 1 step.':
    '<note>Action: Spend 6 M€ to add 1 asteroid <b>to any card</b> (titanium may be used to pay for this), or remove 1 asteroid here to raise temperature 1 step.</note>',
  // Mohole Lake
  'Action: Add a microbe or animal to ANOTHER card.':
    '<note>Action: Add a microbe or animal <b>to another card</b>.</note>',
  // Topsoil Contract
  'Effect: When you gain a microbe to ANY CARD, also gain 1 M€.':
    '<note>Effect: When you gain a microbe <b>to any card</b>, also gain 1 M€.</note>',
  // Imported Nutrients
  'Gain 4 plants and add 4 microbes to ANOTHER CARD.':
    'Gain 4 plants.<note>Add 4 microbes <b>to another card</b>.</note>',
  // Asteroid Deflection System
  'Action: REVEAL AND DISCARD the top card of the deck. If it has a space tag, add an asteroid here.':
    '<note>Action: <b>Reveal and discard</b> the top card of the deck. If it has a space tag, add an asteroid here.</note>',
  // Meat Industry
  'Effect: When you gain an animal to ANY CARD, gain 2 M€.':
    '<note>Effect: When you gain an animal <b>to any card</b>, gain 2 M€.</note>',
  // Advertising
  'Effect: When you play a card with a basic cost of 20 M€ or more, increase your M€ production 1 step.':
    '<note>Effect: When you play a card with a <b>basic cost</b> of 20 M€ or more, increase your M€ production 1 step.</note>',
  // Deimos Down:promo
  'Raise temperature 3 steps and gain 4 steel. Place this tile ADJACENT TO no city tile. Remove up to 6 plants from any player.':
    'Raise temperature 3 steps and gain 4 steel. Remove up to 6 plants from any player.<note>Place this tile <b>adjacent to no city tile</b>.</note>',
  // Great Dam:promo
  'Requires 4 ocean tiles. Increase your energy production 2 steps. Place this tile ADJACENT TO an ocean tile.':
    'Requires 4 ocean tiles. Increase your energy production 2 steps.<note>Place this tile <b>adjacent to an ocean tile</b>.</note>',
  // Saturn Surfing
  'Action: Spend 1 floater from here to gain 1 M€ from each floater here, INCLUDING THE PAID FLOATER. Max 5.':
    '<note>Action: Spend 1 floater from here to gain 1 M€ from each floater here, <b>including the paid floater</b>. Max 5.</note>',
  // Bio Printing Facility
  'Action: Spend 2 energy to gain 2 plants OR to add 1 animal to ANOTHER card.':
    '<note>Action: Spend 2 energy to gain 2 plants or to add 1 animal <b>to another card</b>.</note>',
  // Bactoviral Research
  'Draw 1 card. Choose 1 of your played cards and add 1 microbe to it for each science tag you have, including this.':
    'Draw 1 card.<note>Choose 1 of your played cards and add 1 microbe to it for each science tag you have, <b>including this</b>.</note>',
  // Floyd Continuum
  'Action: Gain 3 M€ per completed terraforming parameter.':
    '<note>Action: Gain 3 M€ per <b>completed</b> terraforming parameter.</note>',
  // Astra Mechanica
  'RETURN UP TO 2 OF YOUR PLAYED EVENT CARDS TO YOUR HAND. THEY MAY NOT BE CARDS THAT PLACE SPECIAL TILES.':
    'Return up to 2 of your played event cards to your hand.<note>They may <b>not be cards that place special tiles</b>.</note>',
  // St. Joseph of Cupertino Mission
  'Action: Pay 5 M€ (STEEL MAY BE USED) to build 1 Cathedral in a city. Max 1 per city. City owner can pay 2 M€ to draw 1 card.':
    'Action: Pay 5 M€ (steel may be used) to build 1 Cathedral in a city. City owner can pay 2 M€ to draw 1 card.<note><b>Max 1 per city</b>.</note>',
  // Hermetic Order of Mars
  'Oxygen must be 4% or lower. Increase your M€ production 2 steps. Gain 1 M€ per empty area adjacent to your tiles.':
    'Oxygen must be 4% or lower. Increase your M€ production 2 steps.<note>Gain 1 M€ per empty area <b>adjacent to your tiles</b>.</note>',
  // Kaguya Tech
  'Increase M€ production 2 steps. Draw 1 card. Remove 1 of your greenery tiles (does not affect oxygen.) Place a city tile there, regardless of placement rules. Gain placement bonuses as usual.':
    'Increase M€ production 2 steps. Draw 1 card. Remove 1 of your greenery tiles (does not affect oxygen.) Gain placement bonuses as usual.<note>Place a city tile there, <b>regardless of placement rules</b>.</note>',
  // Mars Nomads
  'Action: MOVE THE NOMADS to an adjacent, non-reserved empty area and collect THE PLACEMENT BONUS as if placing a special tile there. No tiles may be placed on the Nomad area.':
    'Action: Move the nomads to an adjacent, non-reserved empty area and collect the placement bonus as if placing a special tile there.<note><b>No tiles</b> may be placed on the Nomad area.</note>',
  // Mars Nomads
  'PLACE THE NOMADS on a non-reserved, empty area on the game board.':
    '<note>Place the nomads on a <b>non-reserved, empty area</b> on the game board.</note>',
  // Neptunian Power Consultants
  '(Effect: When any ocean is placed, you MAY pay 5 M€ (steel may be used), to raise energy production 1 step and add 1 hydroelectric resource to this card.)':
    '<note>Effect: When <b>any ocean</b> is placed, you may pay 5 M€ (steel may be used), to raise energy production 1 step and add 1 hydroelectric resource to this card.</note>',
  // Icy Impactors
  'Action: Spend 10 M€ (titanium may be used) to add 2 asteroids here, or spend 1 asteroid here to place an ocean tile. FIRST PLAYER CHOOSES WHERE YOU MUST PLACE IT.':
    'Action: Spend 10 M€ (titanium may be used) to add 2 asteroids here, or spend 1 asteroid here to place an ocean tile.<note>The <b>first player chooses</b> where you must place it.</note>',
  // Soil Enrichment
  'Spend 1 microbe from ANY of your cards to gain 5 plants':
    '<note>Spend 1 microbe from <b>any of your cards</b> to gain 5 plants.</note>',
  // Hospitals
  'Action: Remove a disease from ANY OF YOUR CARDS to gain 1 M€ per city in play.':
    '<note>Action: Remove a disease from <b>any of your cards</b> to gain 1 M€ per city in play.</note>',
  // Vermin
  'Action: Add 1 animal here or 1 microbe to ANOTHER card.':
    '<note>Action: Add 1 animal here or 1 microbe <b>to another card</b>.</note>',
  // Weather Balloons
  '(Action: Add 1 floater here, or spend 1 floater here to gain 1 M€ per city ON MARS.)':
    '<note>Action: Add 1 floater here, or spend 1 floater here to gain 1 M€ per city <b>on Mars</b>.</note>',
  // Arcadian Communities
  'You start with 40 M€ and 10 steel. AS YOUR FIRST ACTION, PLACE A COMMUNITY [PLAYER MARKER] ON A NON-RESERVED AREA.':
    'You start with 40 M€ and 10 steel.<note>As your first action, place a community [player marker] <b>on a non-reserved area</b>.</note>',
  // AstroDrill
  'Action: Add an asteroid resource to ANY card OR gain any standard resource, OR remove an asteroid resource from this card to gain 3 titanium.':
    '<note>Action: Add an asteroid resource <b>to any card</b>, or gain any standard resource, or remove an asteroid resource from this card to gain 3 titanium.</note>',
  // Factorum
  'Action: Increase your energy production 1 step IF YOU HAVE NO ENERGY RESOURCES, or spend 3M€ to draw a building card.':
    '<note>Action: Increase your energy production 1 step <b>if you have no energy resources</b>, or spend 3 M€ to draw a building card.</note>',
  // Mons Insurance
  'You start with 48 M€. Increase your M€ production 4 steps. ALL OPPONENTS DECREASE THEIR M€ production 2 STEPS. THIS DOES NOT TRIGGER THE EFFECT BELOW.':
    'You start with 48 M€. Increase your M€ production 4 steps.<note>All opponents decrease their M€ production 2 steps. This <b>does not trigger the effect below</b>.</note>',
  // Splice
  'Effect: When a microbe tag is played, incl. this, THAT PLAYER gains 2 M€, or adds a microbe to THAT card, and you gain 2 M€.':
    '<note>Effect: When a microbe tag is played, incl. this, <b>that player</b> gains 2 M€, or adds a microbe to <b>that card</b>, and you gain 2 M€.</note>',
  // Kuiper Cooperative
  'Effect: When you use the AQUIFER or ASTEROID standard projects, you can spend asteroids on card as 1M€ each.':
    '<note>Effect: When you use the <b>Aquifer or Asteroid</b> standard projects, you can spend asteroids on this card as 1 M€ each.</note>',
  // PolderTECH Dutch
  'You start with 35 M€. As your first action, place an ocean tile and a greenery tile next to each other IGNORING GREENERY PLACEMENT RESTRICTIONS. Raise oxygen 1 step.':
    'You start with 35 M€. Raise oxygen 1 step.<note>As your first action, place an ocean tile and a greenery tile next to each other, <b>ignoring greenery placement restrictions</b>.</note>',
  // New Partner
  'Raise your M€ production 1 step. Immediately draw 2 prelude cards. Play 1 of them, and discard the other.':
    'Raise your M€ production 1 step.<note>Immediately draw 2 prelude cards. <b>Play 1 of them</b>, and discard the other.</note>',
  // Merger
  'Draw 4 corporation cards. Play one of them and discard the other 3. Then pay 42 M€.':
    '<note>Draw 4 corporation cards. <b>Play one of them</b> and discard the other 3. Then pay 42 M€.</note>',
  // Established Methods
  'Gain 30 M€. Then pay for and perform 2 standard projects.':
    'Gain 30 M€.<note>Then pay for and perform <b>2 standard projects</b>.</note>',
  // Boom Town
  'Place a city tile on an area with a STEEL OR TITANIUM PLACEMENT BONUS. Increase your titanium production 2 steps.':
    'Increase your titanium production 2 steps.<note>Place a city tile on an area <b>with a steel or titanium placement bonus</b>.</note>',
  // Aerial Mappers
  'Action: Add floater to ANY card, or spend one floater here to draw 1 card.':
    '<note>Action: Add a floater <b>to any card</b>, or spend one floater here to draw 1 card.</note>',
  // Atmoscoop
  'Requires 3 science tags. Either raise the temperature 2 steps, or raise Venus 2 steps. Add 2 floaters to ANY card.':
    'Requires 3 science tags. Either raise the temperature 2 steps, or raise Venus 2 steps.<note>Add 2 floaters <b>to any card</b>.</note>',
  // Dawn City
  'Requires 4 science tags. Decrease your energy production 1 step. Increase your titanium production 1 step. Place a city tile on the RESERVED AREA.':
    'Requires 4 science tags. Decrease your energy production 1 step. Increase your titanium production 1 step.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Dirigibles
  'Action: Add 1 floater to ANY card':
    '<note>Action: Add 1 floater <b>to any card</b>.</note>',
  // Extremophiles
  'Action: Add 1 microbe to ANY card.':
    '<note>Action: Add 1 microbe <b>to any card</b>.</note>',
  // Floating Habs
  'Action: Spend 2 M€ to add 1 floater to ANY card':
    '<note>Action: Spend 2 M€ to add 1 floater <b>to any card</b>.</note>',
  // Luna Metropolis
  'Increase your M€ production 1 step for each Earth tag you have, including this. Place a city tile on the RESERVED AREA.':
    'Increase your M€ production 1 step for each Earth tag you have, including this.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Maxwell Base
  'Requires Venus 12%. Decrease your energy production 1 step. Place a city tile ON THE RESERVED AREA.':
    'Requires Venus 12%. Decrease your energy production 1 step.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Sponsored Academies
  'Discard 1 card from your hand and THEN draw 3 cards. All OPPONENTS draw 1 card.':
    '<note>Discard 1 card from your hand and <b>then</b> draw 3 cards. <b>All opponents</b> draw 1 card.</note>',
  // Stratopolis
  'Requires 2 science tags. Increase your M€ production 2 steps. Place a city tile ON THE RESERVED AREA':
    'Requires 2 science tags. Increase your M€ production 2 steps.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Venus Soils
  'Raise Venus 1 step. Increase your plant production 1 step. Add 2 microbes to ANOTHER card':
    'Raise Venus 1 step. Increase your plant production 1 step.<note>Add 2 microbes <b>to another card</b>.</note>',
  // Celestic
  'Action: Add a floater to ANY card. 1 VP per 3 floaters on this card.':
    '1 VP per 3 floaters on this card.<note>Action: Add a floater <b>to any card</b>.</note>',
  // Airliners
  'Requires that you have 3 floaters. Increase your M€ production 2 steps. Add 2 floaters to ANY card.':
    'Requires that you have 3 floaters. Increase your M€ production 2 steps.<note>Add 2 floaters <b>to any card</b>.</note>',
  // Atmo Collectors
  'Add 2 floaters to ANY card.':
    '<note>Add 2 floaters <b>to any card</b>.</note>',
  // Ecology Research
  'Increase your plant production 1 step for each colony you own. Add 1 animal to ANOTHER card and 2 microbes to ANOTHER card.':
    'Increase your plant production 1 step for each colony you own.<note>Add 1 animal <b>to another card</b> and 2 microbes <b>to another card</b>.</note>',
  // Floater Prototypes
  'Add two floaters to ANOTHER card.':
    '<note>Add two floaters <b>to another card</b>.</note>',
  // Floater Technology
  'Action: Add 1 floater to ANOTHER card.':
    '<note>Action: Add 1 floater <b>to another card</b>.</note>',
  // Jovian Lanterns
  'Requires 1 Jovian tag. Increase your TR 1 step. Add 2 floaters to ANY card.':
    'Requires 1 Jovian tag. Increase your TR 1 step.<note>Add 2 floaters <b>to any card</b>.</note>',
  // Research Colony
  'Place a colony. MAY BE PLACED WHERE YOU ALREADY HAVE A COLONY. Draw 2 cards.':
    'Place a colony. Draw 2 cards.<note>It may be placed <b>where you already have a colony</b>.</note>',
  // Space Port Colony
  'Requires a colony. Place a colony. MAY BE PLACED ON A COLONY TILE WHERE YOU ALREADY HAVE A COLONY. Gain 1 Trade Fleet.':
    'Requires a colony. Place a colony. Gain 1 Trade Fleet.<note>It may be placed on a colony tile <b>where you already have a colony</b>.</note>',
  // Spin-off Department
  'Effect: WHEN PLAYING A CARD WITH A BASIC COST OF 20M€ OR MORE, draw a card.':
    '<note>Effect: When playing a card with a <b>basic cost of 20 M€ or more</b>, draw a card.</note>',
  // Urban Decomposers
  'Requires that you have 1 city tile and 1 colony in play. Increase your plant production 1 step, and add 2 microbes to ANOTHER card.':
    'Requires that you have 1 city tile and 1 colony in play. Increase your plant production 1 step.<note>Add 2 microbes <b>to another card</b>.</note>',
  // Polyphemos
  'Effect: When you buy a card to hand, pay 5M€ instead of 3, including the starting hand.':
    '<note>Effect: When you buy a card to hand, pay 5 M€ instead of 3, <b>including the starting hand</b>.</note>',
  // Stormcraft Incorporated
  'Action: Add a floater to ANY card.':
    '<note>Action: Add a floater <b>to any card</b>.</note>',
  // Lava Tube Settlement
  'Decrease your energy production 1 step and increase your M€ production 2 steps. Place a city tile on a VOLCANIC AREA regardless of adjacent cities.':
    'Decrease your energy production 1 step and increase your M€ production 2 steps.<note>Place a city tile <b>on a volcanic area</b> regardless of adjacent cities.</note>',
  // Robinson Industries
  'Action: Spend 4 M€ to increase (one of) your LOWEST production 1 step.':
    '<note>Action: Spend 4 M€ to increase (one of) your <b>lowest</b> production 1 step.</note>',
  // Valley Trust
  'You start with 37 M€. As your first action, draw 3 Prelude cards, and play one of them. Discard the other two.':
    'You start with 37 M€.<note><b>As your first action</b>, draw 3 Prelude cards, and play one of them. Discard the other two.</note>',
  // Vitor
  'Effect: When you play a card with a NON-NEGATIVE VP icon, including this, gain 3 M€.':
    '<note>Effect: When you play a card with a <b>non-negative VP icon</b>, including this, gain 3 M€.</note>',
  // Red Appeasement
  'Requires that Reds are ruling or that you have 2 delegates there, AND THAT NO OTHER PLAYER HAS PASSED.':
    'Requires that Reds are ruling or that you have 2 delegates there.<note>Additionally, <b>no other player may have passed</b>.</note>',
  // L1 Trade Terminal
  '(Add a resource to 3 different cards that already have resources.)':
    '<note>Add a resource to 3 different cards <b>that already have resources</b>.</note>',
  // Colonial Envoys
  'Requires that Unity is ruling or that you have 2 delegates there. Place 1 delegate for each colony you have. YOU MAY PLACE THEM IN SEPARATE PARTIES.':
    'Requires that Unity is ruling or that you have 2 delegates there. Place 1 delegate for each colony you have.<note>You may place them <b>in separate parties</b>.</note>',
  // Floating Refinery
  'Action: Add 1 floater here, or remove 2 floaters from ANY CARD to gain 1 titanium and 2 M€.':
    '<note>Action: Add 1 floater here, or remove 2 floaters <b>from any card</b> to gain 1 titanium and 2 M€.</note>',
  // Frontier Town
  'Requires that Mars First is ruling or that you have 2 delegates there. Decrease your energy production one step. Place a city tile. GAIN THE PRINTED PLACEMENT BONUS 2 ADDITIONAL TIMES.':
    'Requires that Mars First is ruling or that you have 2 delegates there. Decrease your energy production one step. Place a city tile.<note>Gain the printed placement bonus <b>2 additional times</b>.</note>',
  // Stratospheric Expedition
  'Add two floaters to ANY CARD. Draw 2 Venus cards.':
    'Draw 2 Venus cards.<note>Add two floaters <b>to any card</b>.</note>',
  // WG Project
  'Requires that you are Chairman. DRAW 3 PRELUDE CARDS AND PLAY 1 OF THEM, Discard the other 2.':
    'Requires that you are Chairman.<note>Draw 3 <b>prelude cards</b> and play 1 of them. Discard the other 2.</note>',
  // Sagitta Frontier Services
  'Effect: When you play a card with EXACTLY 1 TAG, you gain 1 M€.':
    '<note>Effect: When you play a card with <b>exactly 1 tag</b>, you gain 1 M€.</note>',
  // EcoTec
  'Effect: When you play a bio tag, gain 1 plant or add a microbe to ANY card.':
    '<note>Effect: When you play a bio tag, gain 1 plant or add a microbe <b>to any card</b>.</note>',
  // Spire
  'Effect: When you play a card with at least 2 tags. including this, add 1 science resource here.':
    '<note>Effect: When you play a card with <b>at least 2 tags</b>, including this, add 1 science resource here.</note>',
  // Applied Science
  'Action: Remove 1 resource here to either add 1 resource to ANY CARD WITH A RESOURCE or gain 1 standard resource.':
    '<note>Action: Remove 1 resource here to either add 1 resource <b>to any card with a resource</b> or gain 1 standard resource.</note>',
  // Floating Trade Hub
  'Action: Add 2 floaters to ANY card, or remove any number of floaters here to gain that many of one standard resource.':
    '<note>Action: Add 2 floaters <b>to any card</b>, or remove any number of floaters here to gain that many of one standard resource.</note>',
  // High Circles
  'Raise your TR 1 step and draw 1 card with PARTY REQUIREMENT. Place 2 delegates in one party.':
    'Raise your TR 1 step. Place 2 delegates in one party.<note>Draw 1 card <b>with a party requirement</b>.</note>',
  // Industrial Complex
  'Lose 18 M€. INCREASE ALL YOUR PRODUCTIONS THAT ARE LOWER THAN 1, TO 1.':
    'Lose 18 M€.<note>Increase all your productions <b>that are lower than 1</b> to 1.</note>',
  // Main Belt Asteroids
  'Action: Gain 1 asteroid to ANY CARD.':
    '<note>Action: Add 1 asteroid <b>to any card</b>.</note>',
  // Recession
  'EACH OPPONENT loses 5 M€ and decreases their M€ production 1 step. You gain 10 M€.':
    'You gain 10 M€.<note><b>Each opponent</b> loses 5 M€ and decreases their M€ production 1 step.</note>',
  // Rise To Power
  'Increase your M€ production 3 steps and place 3 delegates. YOU MAY PLACE THEM IN SEPARATE PARTIES.':
    'Increase your M€ production 3 steps and place 3 delegates.<note>You may place them <b>in separate parties</b>.</note>',
  // Suitable Infrastructure
  'Effect: Once per action you take, gain 2 M€ if you increase any productions.':
    '<note>Effect: <b>Once per action</b> you take, gain 2 M€ if you increase any productions.</note>',
  // World Government Advisor
  'Action: RAISE 1 GLOBAL PARAMETER WITHOUT GETTING ANY TR OR OTHER BONUSES.':
    '<note>Action: Raise 1 global parameter <b>without getting any TR or other bonuses</b>.</note>',
  // Recruitment
  'Exchange one NEUTRAL NON-LEADER delegate with one of your own from the reserve.':
    '<note>Exchange one <b>neutral non-leader</b> delegate with one of your own from the reserve.</note>',
  // Red Tourism Wave
  'Requires that Reds are ruling or that you have 2 delegates there. Gain 1 M€ from each EMPTY AREA ADJACENT TO YOUR TILES':
    'Requires that Reds are ruling or that you have 2 delegates there.<note>Gain 1 M€ from each <b>empty area adjacent to your tiles</b>.</note>',
  // Vote Of No Confidence
  'Requires that you have a Party Leader in any party and that the sitting Chairman is neutral. Remove the NEUTRAL Chairman and move your own delegate (from the reserve) there instead. Gain 1 TR.':
    'Requires that you have a Party Leader in any party and that the sitting Chairman is neutral. Gain 1 TR.<note>Remove the <b>neutral</b> Chairman and move your own delegate (from the reserve) there instead.</note>',
  // Septem Tribus
  'Action: Gain 2 M€ for each party where you have at least 1 delegate.':
    '<note>Action: Gain 2 M€ for each party <b>where you have at least 1 delegate</b>.</note>',
  // Aerotech
  'Effect: During each round\'s research phase, gain 1 titanium for each card you do not buy.':
    '<note>Effect: During each round\'s research phase, gain 1 titanium <b>for each card you do not buy</b>.</note>',
  // Curiosity II
  'Effect: When you place a tile on an area that has a RESOURCE placement bonus, or on top of another tile, you may pay 2 M€ to draw a card.':
    '<note>Effect: When you place a tile on an area that has a <b>resource placement bonus</b>, or <b>on top of another tile</b>, you may pay 2 M€ to draw a card.</note>',
  // Athena
  'You start with 62 M€. As your first action, place 2 hazard tiles adjacent to no other tiles.':
    'You start with 62 M€.<note>As your first action, place 2 hazard tiles <b>adjacent to no other tiles</b>.</note>',
  // Executive Order
  'Draw 4 global events. Play 1 as the CURRENT GLOBAL EVENT and discard the rest. Place 2 delegates in any party. Gain 10 M€.':
    'Place 2 delegates in any party. Gain 10 M€.<note>Draw 4 global events. Play 1 <b>as the current global event</b> and discard the rest.</note>',
  // Bioengineering Enclosure
  'Action: Remove 1 animal from THIS card to add 1 animal to ANOTHER card.':
    '<note>Action: Remove 1 animal <b>from this card</b> to add 1 animal <b>to another card</b>.</note>',
  // Bio-Fertilizer Facility
  'Requires 1 science tag. Increase your plant production 1 step. Add up to 2 microbes to ANY card. Place this tile which grants an ADJACENCY BONUS of 1 plant and 1 microbe.':
    'Requires 1 science tag. Increase your plant production 1 step. Place this tile which grants an adjacency bonus of 1 plant and 1 microbe.<note>Add up to 2 microbes <b>to any card</b>.</note>',
  // Deimos Down:ares
  'Raise temperature 3 steps and gain 4 steel. Place this tile ADJACENT TO no city tile. It provides adjacency bonus of 1 asteroid and 1 steel. Remove up to 6 plants from any player.':
    'Raise temperature 3 steps and gain 4 steel. The tile provides an adjacency bonus of 1 asteroid and 1 steel. Remove up to 6 plants from any player.<note>Place this tile <b>adjacent to no city tile</b>.</note>',
  // Desperate Measures
  'Place a bronze cube on a dust storm tile and raise oxygen 1 step, or place a bronze cube on an erosion tile and raise the temperature 1 step. The hazard tile with the bronze cube cannot be removed.':
    'Place a bronze cube on a dust storm tile and raise oxygen 1 step, or place a bronze cube on an erosion tile and raise the temperature 1 step.<note>The hazard tile with the bronze cube <b>cannot be removed</b>.</note>',
  // Industrial Center:ares
  'Place this tile adjacent to a city tile. This tile grants an ADJACENCY BONUS of 1 steel.':
    'Place this tile adjacent to a city tile.<note>This tile grants an <b>adjacency bonus</b> of 1 steel.</note>',
  // Great Dam:ares
  'Requires 4 ocean tiles. Increase your energy production 2 steps. Place this tile ADJACENT TO an ocean tile. The tile grants an ADJACENCY BONUS of 2 Energy.':
    'Requires 4 ocean tiles. Increase your energy production 2 steps.<note>Place this tile <b>adjacent to an ocean tile</b>. The tile grants an <b>adjacency bonus</b> of 2 energy.</note>',
  // Magnetic Field Generators:ares
  'Decrease your energy production 4 steps and increase your plant production 2 steps. Raise your TR 3 steps. Place this tile, which provides an ADJACENCY BONUS of 1 plant and 1 microbe.':
    'Decrease your energy production 4 steps and increase your plant production 2 steps. Raise your TR 3 steps.<note>Place this tile, which provides an <b>adjacency bonus</b> of 1 plant and 1 microbe.</note>',
  // Mining Area:ares
  'Place one of these tiles on an area with a steel or titanium placement bonus, ADJACENT TO ANOTHER OF YOUR TILES. This tile provides an ADJACENCY BONUS of the same resource as the area. Increase your production of that resource 1 step.':
    '<note>Place one of these tiles on an area <b>with a steel or titanium placement bonus</b>, <b>adjacent to another of your tiles</b>. This tile provides an <b>adjacency bonus</b> of the same resource as the area. Increase your production of that resource 1 step.</note>',
  // Mining Rights:ares
  'Place one of these tiles on an area with a steel or titanium placement bonus. This tile provides an ADJACENCY BONUS of the same resource as the area. Increase your production of that resource 1 step.':
    '<note>Place one of these tiles on an area <b>with a steel or titanium placement bonus</b>. This tile provides an <b>adjacency bonus</b> of the same resource as the area. Increase your production of that resource 1 step.</note>',
  // Natural Preserve:ares
  'Oxygen must be 4% or less. Place this tile NEXT TO NO OTHER TILE. The tile grants an ADJACENCY BONUS of of 1 M€. Increase your M€ production 1 step.':
    'Oxygen must be 4% or less. Increase your M€ production 1 step.<note>Place this tile <b>next to no other tile</b>. The tile grants an <b>adjacency bonus</b> of 1 M€.</note>',
  // Solar Farm
  'Place this tile which grants an ADJACENCY BONUS of 2 energy. Increase your energy production 1 step for each plant resource on the area where you place the tile.':
    'Place this tile which grants an adjacency bonus of 2 energy.<note>Increase your energy production 1 step <b>for each plant resource on the area</b> where you place the tile.</note>',
  // Mare Nectaris Mine
  'Spend 1 titanium. Increase your steel production 1 step. Place a mine ON THE RESERVED AREA and raise the mining rate 1 step.':
    'Spend 1 titanium. Increase your steel production 1 step. Raise the mining rate 1 step.<note>Place a mine <b>on the reserved area</b>.</note>',
  // Mare Nubium Mine
  'Spend 1 titanium. Increase your titanium production 1 step. Place a mine ON THE RESERVED AREA and raise the mining rate 1 step.':
    'Spend 1 titanium. Increase your titanium production 1 step. Raise the mining rate 1 step.<note>Place a mine <b>on the reserved area</b>.</note>',
  // Mare Imbrium Mine
  'Spend 1 titanium. Increase your steel production 1 step and your titanium production 1 step. Place a mine ON THE RESERVED AREA and raise the mining rate 1 step.':
    'Spend 1 titanium. Increase your steel production 1 step and your titanium production 1 step. Raise the mining rate 1 step.<note>Place a mine <b>on the reserved area</b>.</note>',
  // Mare Serenitatis Mine
  'Spend 2 titanium and 1 steel. Increase your steel and titanium production 1 step. Place a mine ON THE RESERVED AREA and a road tile adjacent to it. Raise the mining rate 1 step and the logistic rate 1 step.':
    'Spend 2 titanium and 1 steel. Increase your steel and titanium production 1 step. Raise the mining rate 1 step and the logistic rate 1 step.<note>Place a mine <b>on the reserved area</b> and a road tile adjacent to it.</note>',
  // Momentum Virium Habitat
  'Spend 1 titanium. Increase your heat production 2 steps and your M€ production 3 steps. Place a habitat tile ON THE RESERVED AREA and raise the habitat rate 1 step.':
    'Spend 1 titanium. Increase your heat production 2 steps and your M€ production 3 steps. Raise the habitat rate 1 step.<note>Place a habitat tile <b>on the reserved area</b>.</note>',
  // Luna Trade Station
  'Spend 2 titanium. Place this tile ON THE RESERVED AREA.':
    'Spend 2 titanium.<note>Place this tile <b>on the reserved area</b>.</note>',
  // Ancient Shipyards
  'Action: Steal 2 M€ from each player and add a resource cube here.':
    '<note>Action: Steal 2 M€ <b>from each player</b> and add a resource cube here.</note>',
  // Lunar Observation Post
  'Action: Add 1 data resource to ANY card':
    '<note>Action: Add 1 data resource <b>to any card</b>.</note>',
  // Steel Market Monopolists
  'Action: Spend 3X M€ to gain 2X steel (max 9 M€), or spend X steel to gain 3X M€ (max 3 steel).':
    '<note>Action: Spend 3X M€ to gain 2X steel <b>(max 9 M€)</b>, or spend X steel to gain 3X M€ <b>(max 3 steel)</b>.</note>',
  // Titanium Market Monopolists
  'Action: Spend 2X M€ to gain X titanium [max 8 M€], or spend X titanium to gain 4X M€ [max 4 titanium].':
    '<note>Action: Spend 2X M€ to gain X titanium <b>[max 8 M€]</b>, or spend X titanium to gain 4X M€ <b>[max 4 titanium]</b>.</note>',
  // Road Piracy
  'Requires 3 logistic rate. Steal up to 6 steel or 4 titanium from other players. (Resources may be stolen from more than 1 opponent.)':
    'Requires 3 logistic rate. Steal up to 6 steel or 4 titanium from other players.<note>Resources may be stolen <b>from more than 1 opponent</b>.</note>',
  // Lunar Mine Urbanization
  'Requires you have 1 mine tile. Increase your M€ production 1 step. Raise the habitat rate 1 step. Remove 1 of your mine tiles (does not affect the mining rate.) Place this special tile there, regardless of placement rules. Gain placement bonuses as usual. This tile counts both as a habitat and a mine tile.':
    'Requires you have 1 mine tile. Increase your M€ production 1 step. Raise the habitat rate 1 step.<note>Remove 1 of your mine tiles (does not affect the mining rate). Place this special tile <b>there</b>, regardless of placement rules. Gain placement bonuses as usual. This tile counts <b>both as a habitat and a mine tile</b>.</note>',
  // We Grow As One
  'Requires that Unity are ruling or that you have 2 delegates there. Increase ALL colony tile tracks 1 step. Increase each colony tile track 1 step if you have a colony on that colony tile.':
    'Requires that Unity are ruling or that you have 2 delegates there. Increase all colony tile tracks 1 step.<note>Increase each colony tile track 1 step <b>if you have a colony on that colony tile</b>.</note>',
  // An Offer You Can't Refuse
  'Exchange a NON-NEUTRAL opponent delegate with one of your own from the reserve. This exchange may not change the party leader. You may then move your delegate to another party.':
    '<note>Exchange a <b>non-neutral</b> opponent delegate with one of your own from the reserve. This exchange may not change the party leader. You may then move your delegate to another party.</note>',
  // Hostile Takeover
  'Requires a habitat rate of 2 or higher, and a mining rate of 4 or higher. Add your player marker to a habitat tile and a mining tile owned by any opponent. Those now also count as yours. Increase your M€ production 2 steps.':
    'Requires a habitat rate of 2 or higher, and a mining rate of 4 or higher. Increase your M€ production 2 steps.<note>Add your player marker to a habitat tile and a mining tile <b>owned by any opponent</b>. Those now also count as yours.</note>',
  // Syndicate Pirate Raids
  'ALL OPPONENTS CANNOT RETRIEVE THEIR TRADE FLEETS THIS GENERATION':
    '<note><b>All opponents</b> cannot retrieve their trade fleets this generation.</note>',
  // Luna Senate
  'Requires that you have 3 Moon tags. Increase your M€ production 1 step per Moon tag your OPPONENTS have.':
    'Requires that you have 3 Moon tags.<note>Increase your M€ production 1 step per Moon tag <b>your opponents</b> have.</note>',
  // Darkside Observatory
  'Action: Add 1 science to ANY card [EXCEPT those giving 2 VP or more per science resource.], or add 2 data to ANY card.':
    '<note>Action: Add 1 science <b>to any card</b> [<b>except those giving 2 VP or more per science resource</b>], or add 2 data <b>to any card</b>.</note>',
  // Luna Ecumenopolis
  'Spend 2 titanium. Place 2 habitat tiles adjacent to at least 2 other habitat tiles and raise habitat rate 2 steps. Increase your TR 1 step for each 2 steps of the habitat rate.':
    'Spend 2 titanium. Raise the habitat rate 2 steps. Increase your TR 1 step for each 2 steps of the habitat rate.<note>Place 2 habitat tiles <b>adjacent to at least 2 other habitat tiles</b>.</note>',
  // Processor Factory
  'Action: Spend 1 steel to add 2 data resources to ANY card.':
    '<note>Action: Spend 1 steel to add 2 data resources <b>to any card</b>.</note>',
  // Nanotech Industries
  'Action: Add 1 science resource to ANY card [except those giving 2 or more VP per 1 science resource.]':
    '<note>Action: Add 1 science resource <b>to any card</b>, <b>except those giving 2 or more VP per 1 science resource</b>.</note>',
  // The Darkside of The Moon Syndicate
  'Effect: When you place a tile on The Moon, steal 2 M€ from opponents for each of their tiles next to yours.':
    '<note>Effect: When you place a tile on The Moon, steal 2 M€ from opponents <b>for each of their tiles next to yours</b>.</note>',
  // The Grand Luna Capital Group
  'Effect: When you place a habitat tile, gain 2 M€ for each adjacent habitat tile.':
    '<note>Effect: When you place a habitat tile, gain 2 M€ for each <b>adjacent habitat tile</b>.</note>',
  // Mining Complex
  'Place a mine tile on The Moon and raise the mining rate 1 step. Place a road tile adjacent to placed mine tile and raise the logistic rate 1 step. Pay 7 M€.':
    'Place a mine tile on The Moon and raise the mining rate 1 step. Pay 7 M€.<note>Place a road tile <b>adjacent to placed mine tile</b> and raise the logistic rate 1 step.</note>',
  // Breeding Farms
  'Action: Spend 1 plant to add 1 animal to ANY card.':
    '<note>Action: Spend 1 plant to add 1 animal <b>to any card</b>.</note>',
  // Prefabrication of Human Habitats
  'Effect: The CITY STANDARD PROJECT costs 2M€ less. STEEL MAY BE USED as if you were playing a building card.':
    '<note>Effect: The <b>city standard project</b> costs 2 M€ less. Steel may be used as if you were playing a building card.</note>',
  // Wetlands
  '(Requires 2 ocean tiles. Lose 4 plants. Place this tile on an UNRESERVED SPACE ADJACENT TO AT LEAST 2 OCEANS. Raise oxygen 1 step. Gain 1 TR.)':
    'Requires 2 ocean tiles. Lose 4 plants. Raise oxygen 1 step. Gain 1 TR.<note>Place this tile on an <b>unreserved space adjacent to at least 2 oceans</b>.</note>',
  // Dust Storm
  'Every player loses all energy. Raise the temperature 2 steps.':
    'Raise the temperature 2 steps.<note>Every player loses <b>all energy</b>.</note>',
  // Martian Nature Wonders
  'Place a neutral player cube on a non-reserved space. No tile can be placed on that space this game. Gather any bonus on that space, but no bonuses from adjacent spaces. Add 2 data to ANY card.':
    'Place a neutral player cube on a non-reserved space. Gather any bonus on that space, but no bonuses from adjacent spaces.<note><b>No tile</b> can be placed on that space this game. Add 2 data <b>to any card</b>.</note>',
  // Ceres Spaceport
  'Increase your M€ production 2 steps, and titanium production 1 step for every 2 Jovian tags (including these.) Draw a card. Place an ocean tile. Place a city tile ON THE RESERVED AREA.':
    'Increase your M€ production 2 steps, and titanium production 1 step for every 2 Jovian tags (including these.) Draw a card. Place an ocean tile.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Dyson Screens
  'Raise the temperature 1 step. Draw a card. Place a city tile ON THE RESERVED AREA. Raise your energy and heat production 2 steps.':
    'Raise the temperature 1 step. Draw a card. Raise your energy and heat production 2 steps.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Lunar Embassy
  'Increase your M€ production 3 steps, and plant production 1 step for every 2 Earth tags (including this.) Draw a card. Place a city tile ON THE RESERVED AREA.':
    'Increase your M€ production 3 steps, and plant production 1 step for every 2 Earth tags (including this.) Draw a card.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Geological Expedition
  'Effect: When you place a tile ON MARS gain 1 additional resource on the space. If the space has no bonus, gain 1 steel.':
    '<note>Effect: When you place a tile <b>on Mars</b>, gain 1 additional resource on the space. <b>If the space has no bonus</b>, gain 1 steel.</note>',
  // Early Expedition
  'Temperature must be -18 C or lower. Decrease your energy production 1 step and Raise your M€ production 3 steps. Add 1 data to ANY card. Place a city tile on Mars NEXT TO NO OTHER TILE.':
    'Temperature must be -18 C or lower. Decrease your energy production 1 step and raise your M€ production 3 steps.<note>Add 1 data <b>to any card</b>. Place a city tile on Mars <b>next to no other tile</b>.</note>',
  // Hydrogen Processing Plant
  'Oxygen level must be 3% or higher. Decrease oxygen level 1%. Raise your energy production 1 step for every two ocean tiles on Mars.':
    'Oxygen level must be 3% or higher. Raise your energy production 1 step for every two ocean tiles on Mars.<note><b>Decrease</b> oxygen level 1%.</note>',
  // Designed Organisms
  'Requires 5 science tags. Increase your plant production 2 steps. Gain 3 plants. Add 3 microbes to ANY card. Add 1 animal to ANY card.':
    'Requires 5 science tags. Increase your plant production 2 steps. Gain 3 plants.<note>Add 3 microbes <b>to any card</b>. Add 1 animal <b>to any card</b>.</note>',
  // Space Debris Cleaning Operation
  'Requires any 4 space tags in play. Gain 3 titanium. Add 1 resource to ANY card (not cards that take ANIMAL or SCIENCE resources.) Add 1 data to ANY card. Draw 1 card.':
    'Requires any 4 space tags in play. Gain 3 titanium. Draw 1 card.<note>Add 1 resource to any card (<b>not cards that take animal or science resources</b>). Add 1 data <b>to any card</b>.</note>',
  // Secret Labs
  'Requires 1 science tag and 1 Jovian tag. Place an ocean tile. Add 2 microbes to ANY card. OR Raise temperature 1 step. Gain 3 plants. OR Raise oxygen level 1 step. Add 2 floaters to ANY card.':
    'Requires 1 science tag and 1 Jovian tag.<note>Place an ocean tile. Add 2 microbes <b>to any card</b>. Or raise temperature 1 step. Gain 3 plants. Or raise oxygen level 1 step. Add 2 floaters <b>to any card</b>.</note>',
  // Cyanobacteria
  'Raise the oxygen level 1%. For every ocean tile, add a microbe to ANY card.':
    'Raise the oxygen level 1%.<note>For every ocean tile, add a microbe <b>to any card</b>.</note>',
  // Data Leak
  'Add 5 data to ANY card.':
    '<note>Add 5 data <b>to any card</b>.</note>',
  // Solar Storm
  'Every player loses 2 plants. Remove up to 3 data from any player. Raise your heat production 1 step. Raise the temperature 1 step.':
    'Remove up to 3 data from any player. Raise your heat production 1 step. Raise the temperature 1 step.<note><b>Every player</b> loses 2 plants.</note>',
  // Space Relay
  'Effect: Whenever you play a card with a Jovian tag, including this, draw a card.':
    '<note>Effect: Whenever you play a card with a Jovian tag, <b>including this</b>, draw a card.</note>',
  // Martian Culture
  'Action: Add 1 data to ANY card.':
    '<note>Action: Add 1 data <b>to any card</b>.</note>',
  // Small Comet
  'Every player loses 2 plants. Raise the temperature 1 step. Raise the oxygen 1 step. Place an ocean ON AN AREA NOT RESERVED FOR OCEAN. Gain 1 titanium.':
    'Every player loses 2 plants. Raise the temperature 1 step. Raise the oxygen 1 step. Gain 1 titanium.<note>Place an ocean <b>on an area not reserved for ocean</b>.</note>',
  // Economic Espionage
  'Action: Spend 2 M€ to Add 1 data to ANY card.':
    '<note>Action: Spend 2 M€ to add 1 data <b>to any card</b>.</note>',
  // Economic Help
  'Raise the lowest non-completed planetary influence track 3 steps. When tied, raise all lowest tracks 2 steps. Increase your M€ production 1 step':
    'Increase your M€ production 1 step.<note>Raise the <b>lowest non-completed</b> planetary influence track 3 steps. <b>When tied</b>, raise all lowest tracks 2 steps.</note>',
  // Last Resort Ingenuity
  'The next card you play this generation can be paid for with steel or titanium despite its tags.':
    '<note>The next card you play this generation can be paid for <b>with steel or titanium despite its tags</b>.</note>',
  // Crashlanding
  '(Place AND ORIENT this tile on a non-reserved space adjacent to no more than 1 city.':
    '<note>Place <b>and orient</b> this tile on a non-reserved space <b>adjacent to no more than 1 city</b>.</note>',
  // Think Tank
  'Action: Spend 2 M€ to place 1 data on any card.':
    '<note>Action: Spend 2 M€ to place 1 data <b>on any card</b>.</note>',
  // Botanical Experience
  '(EFFECT: Whenever a greenery tile is placed, add 1 data on this card.) (EFFECT: Whenever this card has at least 3 data, automatically remove 3 data to raise your plant production 1 step.) (EFFECT: Players may remove your plants, but you only lose half, rounded up.)':
    'Effect: Whenever a greenery tile is placed, add 1 data on this card. Effect: Players may remove your plants, but you only lose half, rounded up.<note>Effect: Whenever this card has at least 3 data, <b>automatically</b> remove 3 data to raise your plant production 1 step.</note>',
  // Oumuamua Type Object Survey
  'Requires 1 space tag and 1 science tag. Add 2 data to ANY card.':
    'Requires 1 space tag and 1 science tag.<note>Add 2 data <b>to any card</b>.</note>',
  // Solarpedia
  'Requires 1 Venus, Earth, Mars, and Jovian Tag. Add 2 data to ANY card. 1 VP for every 6 data resources here.':
    'Requires 1 Venus, Earth, Mars, and Jovian tag. 1 VP for every 6 data resources here.<note>Add 2 data <b>to any card</b>.</note>',
  // Solarpedia
  'Action: Add 2 data to ANY card.':
    '<note>Action: Add 2 data <b>to any card</b>.</note>',
  // Nobel Labs
  'Action: Add 2 microbes OR 2 data OR 2 floaters to ANY card.':
    '<note>Action: Add 2 microbes or 2 data or 2 floaters <b>to any card</b>.</note>',
  // Huygens Observatory
  'Place a colony. MAY BE PLACED ON A COLONY TILE WHERE YOU ALREADY HAVE A COLONY. Trade for free. You may use a Trade Fleet that is already on a colony tile, but you may not trade with the tile that fleet came from. Gain 1 TR.':
    'Place a colony. Trade for free. You may use a Trade Fleet that is already on a colony tile, but you may not trade with the tile that fleet came from. Gain 1 TR.<note>The colony may be placed <b>on a colony tile where you already have a colony</b>.</note>',
  // Cassini Station
  'Increase your energy production 1 step for every colony in play. Add 2 floaters to ANY card OR add 3 data to ANY card.':
    'Increase your energy production 1 step for every colony in play.<note>Add 2 floaters <b>to any card</b> or add 3 data <b>to any card</b>.</note>',
  // Microbiology Patents
  'Effect: After you play a card with a microbe tag, increase your M€ production 1 step.':
    '<note>Effect: After you play a card <b>with a microbe tag</b>, increase your M€ production 1 step.</note>',
  // Coordinated Raid
  'Requires at least 1 colony in play. Send one of your unused Trade Fleets to any colony tile. Collect the trade bonus and colony bonus for every colony on this tile. Other players do not get their colony bonuses from this action.':
    'Requires at least 1 colony in play. Send one of your unused Trade Fleets to any colony tile.<note>Collect the trade bonus and <b>the colony bonus for every colony</b> on this tile. <b>Other players do not get</b> their colony bonuses from this action.</note>',
  // Venera Base
  'Requires Unity is ruling or that you have 2 delegates there. Raise your M€ production 3 steps and place a city tile ON THE RESERVED AREA.':
    'Requires Unity is ruling or that you have 2 delegates there. Raise your M€ production 3 steps.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Venera Base
  'Action: Add 1 floater to ANY Venus card':
    '<note>Action: Add 1 floater <b>to any Venus card</b>.</note>',
  // Soil Detoxification
  'Effect: Using the STANDARD GREENERY ACTION costs 1 plant less.':
    '<note>Effect: Using the <b>standard greenery action</b> costs 1 plant less.</note>',
  // High Temp. Superconductors
  'Effect: When playing a power card, THE STANDARD PROJECT POWER PLANT, OR THE KELVINIST RULING POLICY ACTION, pay 3M€ less.':
    '<note>Effect: When playing a power card, <b>the standard project power plant, or the Kelvinist ruling policy action</b>, pay 3 M€ less.</note>',
  // Public Sponsored Grant
  'Requires Scientists are ruling or that you have 2 delegates there. All players lose 2M€. Choose a tag (NOT CITY, ? OR PLANETARY TRACK) and draw 2 cards with that tag.':
    'Requires Scientists are ruling or that you have 2 delegates there. All players lose 2 M€.<note>Choose a tag (<b>not city, ? or planetary track</b>) and draw 2 cards with that tag.</note>',
  // Controlled Bloom
  'Requires 3 oceans. Add 3 microbes to ANY card. Gain 3 plants.':
    'Requires 3 oceans. Gain 3 plants.<note>Add 3 microbes <b>to any card</b>.</note>',
  // Ambient
  'Effect: When you play a card with a Venus tag (including this) increase your heat production 1 step.':
    '<note>Effect: When you play a card with a Venus tag (<b>including this</b>), increase your heat production 1 step.</note>',
  // Ringcom
  'Effect: When any player plays a card with a Jovian tag (including this) gain 1 titanium.':
    '<note>Effect: When <b>any player</b> plays a card with a Jovian tag (<b>including this</b>), gain 1 titanium.</note>',
  // Chimera
  'Effect: When you perform an action, these wild tags count as any tags of your choice. For claiming milestones and funding awards, both symbols count as one. (Other wild tags still do not count toward awards.)':
    '<note>Effect: When you perform an action, these wild tags count as any tags of your choice. For claiming milestones and funding awards, <b>both symbols count as one</b>. (Other wild tags still do not count toward awards.)</note>',
  // Mars Maths
  'Effect: At the beginning of the Research phase, you draw 5 cards, but may STILL only buy 4 cards. If you are drafting, keep 2 cards for your first draft.':
    '<note>Effect: At the beginning of the Research phase, you draw 5 cards, but may <b>still only buy 4 cards</b>. If you are drafting, keep 2 cards for your first draft.</note>',
  // SolBank
  'Effect: Whenever you spend M€ (or steel or titanium) add 1 data to this card.':
    '<note>Effect: Whenever you spend M€ (<b>or steel or titanium</b>), add 1 data to this card.</note>',
  // Bio-Sol
  'Action: Add 1 microbe to ANY card':
    '<note>Action: Add 1 microbe <b>to any card</b>.</note>',
  // Aurorai
  'Effect: Whenever you increase your terraform rating, add 1 data per step to ANY card.':
    '<note>Effect: Whenever you increase your terraform rating, add 1 data per step <b>to any card</b>.</note>',
  // Aurorai
  'Effect: You can use data on this card as 3M€ each to pay for standard projects.':
    '<note>Effect: You can use data on this card as 3 M€ each <b>to pay for standard projects</b>.</note>',
  // Collegium Copernicus
  'Effect: When you play a card with a science tag (including this) Add 1 data to ANY card.':
    '<note>Effect: When you play a card with a science tag (<b>including this</b>), add 1 data <b>to any card</b>.</note>',
  // Robin Haulings
  'Effect: Whenever you play a card with a Venus tag add 1 floater to ANY card.':
    '<note>Effect: Whenever you play a card with a Venus tag, add 1 floater <b>to any card</b>.</note>',
  // Odyssey
  'Action: Pay for and play an event card you have already played that has a base cost of 16M€ or less (INCLUDING events that place special tiles,) after which discard that card.':
    'Action: Pay for and play an event card you have already played that has a base cost of 16 M€ or less, then discard that card.<note>This <b>includes events that place special tiles</b>.</note>',
  // Gagarin Mobile Base
  'Action: Move the Base to ANY nearest empty area where it has not yet been. Collect the bonus.':
    'Action: Move the Base. Collect the bonus.<note>Move it to any of <b>the nearest empty areas where it has not yet been</b>.</note>',
  // Mind Set Mars
  '(Action: When you play a card with a building tag, add 1 agenda on this card.)':
    '<note>Effect: When you play a card <b>with a building tag</b>, add 1 agenda to this card.</note>',
  // Adhai High Orbit Constructions
  '(Effect: Whenever you play a card with a space tag BUT NO PLANETARY TAG (including this) add 1 orbital on this card.)':
    '<note>Effect: Whenever you play a card with a space tag <b>but no planetary tag</b> (including this), add 1 orbital to this card.</note>',
  // Valuable Gases:Pathfinders
  'Gain 10 M€. PLAY AN ACTIVE FLOATER CARD FROM HAND, IGNORING GLOBAL REQUIREMENTS, and add 5 floaters to it.':
    'Gain 10 M€.<note>Play an active floater card from hand, <b>ignoring global requirements</b>, and add 5 floaters to it.</note>',
  // Personal Agenda
  'Increase your M€ production 3 steps. Draw 3 event cards that do not have a space tag.':
    'Increase your M€ production 3 steps.<note>Draw 3 event cards <b>that do not have a space tag</b>.</note>',
  // Asimov
  'Once per game, draw 10-X awards (min. 1), where X is the current generation number. You may put one into the game and fund it for free.':
    'Once per game, draw 10-X awards (min. 1), where X is the current generation number.<note>You may put one into the game and <b>fund it for free</b>.</note>',
  // Bjorn
  'Once per game, steal X+2 M€ from each player that has more M€ than you, where X is the current generation number.':
    '<note>Once per game, steal X+2 M€ from each player <b>that has more M€ than you</b>, where X is the current generation number.</note>',
  // Caesar
  'Once per game, place X hazard tiles where X is the current generation number. Each opponent loses 1 unit of production of their choice, or 2 units if there are 6 or more hazard tiles.':
    'Once per game, place X hazard tiles where X is the current generation number.<note>Each opponent loses 1 unit of production of their choice, <b>or 2 units if there are 6 or more hazard tiles</b>.</note>',
  // Clarke
  'Once per game, increase your plant and heat production 1 step each. Gain plants and heat equal to your production +4.':
    'Once per game, increase your plant and heat production 1 step each.<note>Gain plants and heat <b>equal to your production +4</b>.</note>',
  // Duncan
  'Once per game, gain 7-X VP and 4X M€, where X is the current generation number.':
    '<note>Once per game, gain 7-X VP and 4X M€, <b>where X is the current generation number</b>.</note>',
  // Faraday
  'When you gain a multiple of 5 for any tag type IN PLAY, you may pay 3 M€ to draw a card with that tag. Wild tags do not count for this effect.':
    '<note>When you gain a multiple of 5 for any tag type <b>in play</b>, you may pay 3 M€ to draw a card with that tag. <b>Wild tags do not count</b> for this effect.</note>',
  // Floyd
  'Once per game, play a card from hand for 13 + 2X M€ less, where X is the current generation number.':
    '<note>Once per game, play a card from hand for 13 + 2X M€ less, <b>where X is the current generation number</b>.</note>',
  // Gaia
  'Once per game, gain the Ares adjacency bonuses of all player-owned tiles on Mars.':
    '<note>Once per game, gain the Ares adjacency bonuses of <b>all player-owned tiles</b> on Mars.</note>',
  // Greta
  'When you take an action or play a card that increases your TR THIS GENERATION (max 10 times), gain 4 M€.':
    '<note>When you take an action or play a card that increases your TR <b>this generation</b> (<b>max 10 times</b>), gain 4 M€.</note>',
  // HAL 9000
  'Once per game, decrease each of your productions 1 step to gain 4 of that resource.':
    '<note>Once per game, decrease <b>each of your productions</b> 1 step to gain 4 of that resource.</note>',
  // Huan
  'ALL OPPONENTS CANNOT TRADE NEXT GENERATION. Gain 1 Trade Fleet.':
    'Gain 1 Trade Fleet.<note>All opponents <b>cannot trade next generation</b>.</note>',
  // Ingrid
  'When you take an action that places a tile on Mars THIS GENERATION, draw a card.':
    '<note>When you take an action <b>this generation</b> that places a tile <b>on Mars</b>, draw a card.</note>',
  // Jansson
  'Once per game, gain all placement bonuses under your tiles on Mars.':
    '<note>Once per game, gain all placement bonuses <b>under your tiles on Mars</b>.</note>',
  // Karen
  'Once per game, draw Prelude cards equal to the current generation number and choose one to play, and discard the rest.':
    '<note>Once per game, draw Prelude cards <b>equal to the current generation number</b>, choose one to play and discard the rest.</note>',
  // Lowell
  'Once per game, pay 8 M€ to draw 3 CEO cards and choose one to play. Discard this card.':
    'Once per game, pay 8 M€ to draw 3 CEO cards and choose one to play.<note><b>Discard this card</b>.</note>',
  // Musk
  'Once per game, discard any number of Earth cards to draw that many space cards, and gain that many units of titanium, plus 6.':
    'Once per game, discard any number of Earth cards to draw that many space cards.<note>Gain that many units of titanium, <b>plus 6</b>.</note>',
  // Naomi
  'Once per game, move each colony tile track marker to its highest or lowest value.':
    '<note>Once per game, move each colony tile track marker to its <b>highest or lowest value</b>.</note>',
  // Neil
  'Once per game, increase your M€ production by the value of the LOWEST Moon rate.':
    '<note>Once per game, increase your M€ production by the value of the <b>lowest Moon rate</b>.</note>',
  // Petra
  'Once per game, replace all Neutral delegates with your delegates. Gain 3 M€ for each delegate replaced this way. Place 3 Neutral delegates.':
    'Once per game, replace all Neutral delegates with your delegates. Place 3 Neutral delegates.<note>Gain 3 M€ <b>for each delegate replaced</b> this way.</note>',
  // Quill
  'Once per game, add 2 floaters to each of your cards that collect floaters, then add 2 floaters to ANY card. Gain 1 M€ for every 2 floaters added this way.':
    'Once per game, add 2 floaters to each of your cards that collect floaters, then add 2 floaters to any card.<note>Gain 1 M€ <b>for every 2 floaters added</b> this way.</note>',
  // Shara
  'Once per game, choose a planet tag. This card counts as having immediately played 2 of that tag. Then gain M€ equal to that tag\'s planetary influence track.':
    'Once per game, choose a planet tag. This card counts as having immediately played 2 of that tag.<note>Then gain M€ <b>equal to that tag\'s planetary influence track</b>.</note>',
  // Tate
  'Once per game, name a tag. Reveal cards from the deck until you find 5 cards with that tag. BUY up to 2 cards and discard the rest.':
    'Once per game, name a tag.<note>Reveal cards from the deck until you find <b>5 cards with that tag</b>. <b>Buy up to 2</b> cards and discard the rest.</note>',
  // Ulrich
  'Once per game, gain 4 M€ for each ocean placed. If all oceans are already placed, gain only 15 M€.':
    'Once per game, gain 4 M€ for each ocean placed.<note><b>If all oceans are already placed</b>, gain only 15 M€.</note>',
  // Xavier
  'Once per game, gain 2 wild tags for THIS GENERATION.':
    '<note>Once per game, gain 2 wild tags <b>for this generation</b>.</note>',
  // Zan
  'Effect: You are immune to Reds\' ruling policy.':
    '<note>Effect: You are <b>immune to Reds\' ruling policy</b>.</note>',
  // Behold The Emperor! (III)
  'Requires that you are Chairman. The current ruling party will automatically be the ruling party during the next Solar phase, and you will remain the Chairman. (As if the current ruling party were dominant and you were its party leader.)':
    'Requires that you are Chairman.<note>The current ruling party will automatically be the ruling party during the next Solar phase, and <b>you will remain the Chairman</b>. (As if the current ruling party were dominant and you were its party leader.)</note>',
  // Cloud City (V)
  'Requires Venus 6%. Raise Venus 1 step. Add 2 floaters to any card.':
    'Requires Venus 6%. Raise Venus 1 step.<note>Add <b>2 floaters</b> to any card.</note>',
  // Forest Moon (VI)
  'Requires any 4 greeneries on Mars. Decrease any energy production 2 steps. Add an animal to any card.':
    'Requires any 4 greeneries on Mars. Decrease any energy production 2 steps.<note>Add <b>an animal</b> to any card.</note>',
  // Rey ... Skywalker?! (IX)
  'Raise your M€ production 4 steps. Place a bronze cube on an empty unreserved space on Mars. No tile or token may be placed on that space for the rest of the game.':
    'Raise your M€ production 4 steps.<note>Place a bronze cube on an <b>empty unreserved space on Mars</b>. <b>No tile or token</b> may be placed on that space for the rest of the game.</note>',
  // Geologist Team
  'Effect: When ANY player identifies an underground resource that depicts an ocean, YOU gain 1 TR.':
    '<note>Effect: When <b>any player</b> identifies an underground resource that <b>depicts an ocean</b>, you gain 1 TR.</note>',
  // Gaia City
  'Reduce your energy production one step and increase your plant production 2 steps. Place a city on a NON-RESERVED SPACE WITH YOUR EXCAVATION MARKER, ignoring other placement restrictions':
    'Reduce your energy production one step and increase your plant production 2 steps.<note>Place a city <b>on a non-reserved space with your excavation marker</b>, ignoring other placement restrictions.</note>',
  // Cave City
  'Increase your steel production 1 step. Place a city in a NON-RESERVED SPACE WITH YOUR EXCAVATION MARKER, ignoring other placement restrictions':
    'Increase your steel production 1 step.<note>Place a city <b>in a non-reserved space with your excavation marker</b>, ignoring other placement restrictions.</note>',
  // Subnautic Pirates
  'Requires you have 1 corruption and 1 underground token. Steal up to 7 M€ from a player that HAS A TILE NEXT TO AN OCEAN.':
    'Requires you have 1 corruption and 1 underground token.<note>Steal up to 7 M€ from a player that <b>has a tile next to an ocean</b>.</note>',
  // Labor Trafficking
  'Effect: The first standard project action you take each generation, except selling patents, costs 6 M€ less.':
    '<note>Effect: The <b>first</b> standard project action you take each generation, <b>except selling patents</b>, costs 6 M€ less.</note>',
  // Subterranean Sea
  'Place an ocean tile ON AN AREA NOT RESERVED FOR OCEAN where you have an excavation marker.':
    '<note>Place an ocean tile <b>on an area not reserved for ocean</b> where you have an excavation marker.</note>',
  // Search for Life Underground
  'Action: Spend 1 M€ to identify an underground resource. If it depicts at least 1 microbe, add a science resource here.':
    'Action: Spend 1 M€ to identify an underground resource.<note>If it depicts <b>at least 1 microbe</b>, add a science resource here.</note>',
  // Patent Manipulation
  'RETURN 1 OF YOUR PLAYED GREEN OR BLUE CARDS TO YOUR HAND. IT MAY NOT BE A CARD THAT PLACES SPECIAL TILES OR RETURNS PLAYED CARDS TO YOUR HAND.':
    'Return 1 of your played green or blue cards to your hand.<note>It may not be a card that <b>places special tiles or returns played cards to your hand</b>.</note>',
  // Underground Smuggling Ring
  'Requires you have 1 underground token. Gain 1 corruption and 2 of the same standard resource.':
    'Requires you have 1 underground token. Gain 1 corruption.<note>Gain <b>2 of the same standard resource</b>.</note>',
  // Deepmining
  'Excavate an underground resource that depicts steel or titanium ANYWHERE ON THE BOARD. Increase your production of that resource 1 step.':
    '<note>Excavate an underground resource that depicts steel or titanium <b>anywhere on the board</b>. Increase your production of <b>that resource</b> 1 step.</note>',
  // Tunneling Loophole
  'Requires 1 Earth tag. Until the end of this generation, you can excavate ignoring placement restrictions. Excavate 1 underground resource. Gain 1 corruption.':
    'Requires 1 Earth tag. Excavate 1 underground resource. Gain 1 corruption.<note>Until the end of this generation, you can excavate <b>ignoring placement restrictions</b>.</note>',
  // Orbital Laser Drill
  'Requires 2 science tags. Excavate 2 underground resources, IGNORING PLACEMENT RESTRICTIONS.':
    'Requires 2 science tags.<note>Excavate 2 underground resources, <b>ignoring placement restrictions</b>.</note>',
  // Grey Market Exploitation
  'Action: Spend 1 M€ to gain 1 standard resource, or spend 1 corruption to gain 3 of the same standard resource.':
    '<note>Action: Spend 1 M€ to gain 1 <b>standard resource</b>, or spend 1 corruption to gain 3 of the <b>same standard resource</b>.</note>',
  // Landfill
  'Increase your M€ production 1 step for each different TYPE of production you have at least 1 step of.':
    '<note>Increase your M€ production 1 step for each <b>different type of production</b> you have at least 1 step of.</note>',
  // Private Military Contractor
  'Effect: When blocking damage from other players, you can use fighters here as if they were corruption resources. You cannot use them for score bribing or collusion.':
    '<note>Effect: When blocking damage from other players, you can use fighters here <b>as if they were corruption resources</b>. You cannot use them for score bribing or collusion.</note>',
  // Space Privateers
  'Action: Steal up to 1 M€ per fighter here, from EACH OTHER player. For each player that blocks this, remove 1 fighter from here.':
    '<note>Action: Steal up to 1 M€ per fighter here <b>from each other player</b>. For each player that blocks this, remove 1 fighter from here.</note>',
  // Personal Spacecruiser
  'Gain 1 corruption. Put 1 fighter on ANY card.':
    'Gain 1 corruption.<note>Put 1 fighter on <b>any card</b>.</note>',
  // Hyperspace Drive Prototype
  'Requires that 3 science tags. Put a fighter resource on a card you own, or gain 1 titanium if you have no suitable card. Put a science resource on a card you own, or gain 1 TR if you have no suitable card.':
    'Requires 3 science tags.<note>Put a fighter resource on a card you own, or gain 1 titanium <b>if you have no suitable card</b>. Put a science resource on a card you own, or gain 1 TR <b>if you have no suitable card</b>.</note>',
  // Star Vegas
  'Requires any 3 cities in play. Place a city on a space reserved for a different space city. Gain 2 corruption. Increase your M€ production one step for each city in play.':
    'Requires any 3 cities in play. Gain 2 corruption. Increase your M€ production one step for each city in play.<note>Place a city <b>on a space reserved for a different space city</b>.</note>',
  // Micro-Geodesics
  'Action: Spend 1 microbe from ANY card and discard 1 of your claimed underground resource tokens to gain 3 plants.':
    '<note>Action: Spend 1 microbe <b>from any card</b> and discard 1 of your claimed underground resource tokens to gain 3 plants.</note>',
  // Soil Export
  'Excavate an underground resource. Add 3 floaters to any card':
    'Excavate an underground resource.<note>Add 3 floaters to <b>any card</b>.</note>',
  // Artesian Aquifer
  'Excavate 1 underground resource on ANY SPACE RESERVED FOR AN OCEAN. Then, place an ocean tile there, if possible.':
    '<note>Excavate 1 underground resource <b>on any space reserved for an ocean</b>. Then, place an ocean tile there, if possible.</note>',
  // Corporate Theft
  'Action: Pay 5 M€ to steal ANY 1 resource from another player. If it is a card resource, you may put it on a suitable card.':
    '<note>Action: Pay 5 M€ to steal <b>any 1 resource</b> from another player. If it is a card resource, you may put it on a suitable card.</note>',
  // Underground Research Center
  'Requires you have 4 underground tokens. Excavate an underground resource. Choose a tag that is not the wild tag or clone tag. Draw a card with that tag.':
    'Requires you have 4 underground tokens. Excavate an underground resource.<note>Choose a tag <b>that is not the wild tag or clone tag</b>. Draw a card with that tag.</note>',
  // Price Wars
  'Requires 2 corruption. Until the end of this generation, your steel and titanium are worth 1 more M€ each, and steel and titanium for other players is worth 1 M€ less.':
    'Requires 2 corruption.<note><b>Until the end of this generation</b>, your steel and titanium are worth 1 more M€ each, and steel and titanium <b>for other players</b> is worth 1 M€ less.</note>',
  // Anti-trust Crackdown
  'Requires that you have no more than 0 corruption. ALL players lose 2 corruption each.':
    'Requires that you have no more than 0 corruption.<note><b>All players</b> lose 2 corruption each.</note>',
  // Monopoly
  'Requires 2 corruption. Choose a standard resource type. Steal up to 2 units of that resource from EACH OTHER player.':
    'Requires 2 corruption.<note>Choose a <b>standard resource</b> type. Steal up to 2 units of that resource <b>from each other player</b>.</note>',
  // Staged Protests
  'Requires 1 corruption. Gain 1 corruption. Until the end of this generation, milestones and awards cost +8 M€.':
    'Requires 1 corruption. Gain 1 corruption.<note><b>Until the end of this generation</b>, milestones and awards cost +8 M€.</note>',
  // Plant Tax
  'ALL players lose 2 plants. Players can block this with corruption. Gain 1 corruption.':
    'Gain 1 corruption.<note><b>All players</b> lose 2 plants. Players can block this with corruption.</note>',
  // Induced Tremor
  'You may discard 1 underground resource of your choice from the board. Then excavate an underground resource.':
    'Excavate an underground resource.<note>Before that, you may discard 1 underground resource <b>of your choice from the board</b>.</note>',
  // Underground Habitat
  'Excavate an underground resource. Increase your plant production 1 step. Add 1 animal on another card.':
    'Excavate an underground resource. Increase your plant production 1 step.<note>Add 1 animal <b>to another card</b>.</note>',
  // Martian Express
  'Effect: This card can receive any resource that can be placed on ANY card. Resources placed here get converted to wares resources.':
    '<note>Effect: This card can receive any resource that can be placed on <b>any card</b>. Resources placed here get converted to wares resources.</note>',
  // Expedition Vehicles
  'Effect: After you place a tile (on Mars or in space) that has no adjacent tiles, draw a card.':
    '<note>Effect: After you place a tile (on Mars or in space) <b>that has no adjacent tiles</b>, draw a card.</note>',
  // Class-action Lawsuit
  'The player with more corruption than anybody else discards corruption until they have the same amount as the 2nd highest player, along with 3 M€ per unit of corruption removed this way.':
    '<note><b>The player with more corruption than anybody else</b> discards corruption until they have the same amount as the 2nd highest player, along with 3 M€ per unit of corruption removed this way.</note>',
  // Research & Development Hub
  'Effect: At the end of each production phase, add 1 data here for EACH OTHER PLAYER that has 7 or more cards in their hand.':
    '<note>Effect: At the end of each production phase, add 1 data here <b>for each other player</b> that has 7 or more cards in their hand.</note>',
  // Investigative Journalism
  'Action: Spend 5 M€ and remove 1 corruption from ANOTHER player with more corruption than you to add 1 journalism resource on this card.':
    '<note>Action: Spend 5 M€ and remove 1 corruption <b>from another player with more corruption than you</b> to add 1 journalism resource on this card.</note>',
  // Guerilla Ecologists
  'Requires 1 corruption. Spend 4 plants to place a greenery tile IGNORING ADJACENCY RESTRICTIONS.':
    'Requires 1 corruption.<note>Spend 4 plants to place a greenery tile <b>ignoring adjacency restrictions</b>.</note>',
  // Racketeering
  'Requires 1 corruption. Increase your M€ production one step for each crime tag you have INCLUDING EVENTS and this card.':
    'Requires 1 corruption.<note>Increase your M€ production one step for each crime tag you have <b>including events</b> and this card.</note>',
  // Gas Trust
  'Gain 1 corruption. Gain 3 heat for each crime tag you have INCLUDING EVENTS and this card.':
    'Gain 1 corruption.<note>Gain 3 heat for each crime tag you have <b>including events</b> and this card.</note>',
  // Biobatteries
  'Increase your energy production 1 step. Gain 1 energy for every microbe tag you have (including this.) For every power tag you have (including this) put 1 microbe on another card.':
    'Increase your energy production 1 step. Gain 1 energy for every microbe tag you have (including this).<note>For every power tag you have (including this) put 1 microbe <b>on another card</b>.</note>',
  // Export Convoy
  'Pay 4 plants, or 3 microbes, or 2 animals from any of your cards. Gain 20 M€ and 1 corruption.':
    'Gain 20 M€ and 1 corruption.<note>Pay 4 plants, or 3 microbes, or 2 animals <b>from any of your cards</b>.</note>',
  // Deep Foundations
  'Action: Pay 20 M€ (STEEL MAY BE USED). Pick a valid space for a city on Mars. Excavate the underground resource in that space, if possible. Then place a city there.':
    'Action: Pay 20 M€ (steel may be used). Pick a valid space for a city on Mars.<note>Excavate the underground resource <b>in that space</b>, if possible. Then place a city there.</note>',
  // Standard Technology:u
  '(Action: Use a standard project that you\'ve already used this generation, with its cost reduced by 8 M€.)':
    '<note>Action: Use a standard project <b>that you\'ve already used this generation</b>, with its cost reduced by 8 M€.</note>',
  // Henkei Genetics
  'Action: Pay 1 corruption to place 3 microbes on each card, up 2 to cards.':
    '<note>Action: Pay 1 corruption to place 3 microbes on each of <b>up to 2 cards</b>.</note>',
  // Aeron Genomics
  'Action: Discard up to 2 of your claimed underground resource tokens to place the same number of animals on ANY card.':
    '<note>Action: Discard up to 2 of your claimed underground resource tokens to place the same number of animals <b>on any card</b>.</note>',
  // Keplertec
  'Action: Spend 1 titanium to put a fighter resource on ANY card.':
    '<note>Action: Spend 1 titanium to put a fighter resource <b>on any card</b>.</note>',
  // Keplertec
  'Effect: When you place a fighter on this card, identify 4 underground resources FROM THE PILE. Claim 1. Shuffle the remaining tokens back into the pile.':
    '<note>Effect: When you place a fighter on this card, identify 4 underground resources <b>from the pile</b>. Claim 1. Shuffle the remaining tokens back into the pile.</note>',
  // Anubis Securities
  'Effect: When any player WITH THE LOWEST CORRUPTION increases their TR by 1, they gain 2 M€.':
    '<note>Effect: When any player <b>with the lowest corruption</b> increases their TR by 1, they gain 2 M€.</note>',
  // Anubis Securities
  'Action: Discard ALL of your corruption and gain 6 M€ for each unit discarded.':
    '<note>Action: Discard <b>all</b> of your corruption and gain 6 M€ for each unit discarded.</note>',
  // Underground Settlement
  'Place a city. Then identify the underground resources in all adjacent spaces. Claim 1 of them.':
    'Place a city.<note>Then identify the underground resources <b>in all adjacent spaces</b>. Claim 1 of them.</note>',
  // Central Reservoir
  'Place an ocean ON AN AREA NOT RESERVED FOR OCEAN. Then identify the underground resources in all adjacent spaces. Claim 2 of them.':
    '<note>Place an ocean <b>on an area not reserved for ocean</b>. Then identify the underground resources <b>in all adjacent spaces</b>. Claim 2 of them.</note>',
  // Deepwater Dome
  'Effect: When you excavate next to an ocean, gain 2 M€.':
    '<note>Effect: When you excavate <b>next to an ocean</b>, gain 2 M€.</note>',
  // Prospecting
  'Pay 4 M€. Put an additional colony tile of your choice into play. Then place a colony on it.':
    'Pay 4 M€.<note>Put <b>an additional colony tile</b> of your choice into play. Then place a colony on it.</note>',
  // Cloud Vortex Outpost
  'Action: Remove 1 floater from THIS card to add 1 floater to ANOTHER card':
    '<note>Action: Remove 1 floater <b>from this card</b> to add 1 floater <b>to another card</b>.</note>',
};
