// Spielerwürfel erzeugen – gemeinsam für player-cube.html und player-cube-usecases.html (Styles: player-cube.css)
function createPlayerCube({material = '', view = 'view-slight', color, size, spin}) {
  const element = document.createElement('span');
  element.className = ['cube3d', view, material].filter(Boolean).join(' ');
  element.style.setProperty('--cube-color', color);
  element.style.setProperty('--cube-size', size + 'px');
  // Reflexe in klein dämpfen: 0.2 bei kleinen Würfeln bis 1 ab ca. 64 px
  element.style.setProperty('--detail', String(Math.min(1, Math.max(0.2, (size - 14) / 50))));
  // Drehung um die eigene senkrechte Achse (z. B. zufällig hingelegt auf der Karte); Licht bleibt dabei fest oben links
  if (spin !== undefined) {
    element.style.setProperty('--cube-turn', spin + 'deg');
  }
  // Immer alle sechs Flächen: je nach Drehung werden andere sichtbar, beim Acryl scheinen die hinteren durch
  element.innerHTML = '<span class="body"><i class="face back"></i><i class="face right"></i><i class="face bottom"></i><i class="face top"></i><i class="face left"></i><i class="face front"></i></span>';
  return element;
}

// Spielerfarben aus src/styles/variables.less
const PLAYER_COLORS = {
  red: 'rgb(153, 17, 0)', yellow: 'rgb(170, 170, 0)', green: 'rgb(0, 153, 0)', black: 'rgb(170, 170, 170)',
  blue: 'rgb(0, 102, 255)', purple: 'rgb(140, 0, 255)', orange: 'rgb(236, 113, 12)', pink: 'rgb(245, 116, 187)',
};
