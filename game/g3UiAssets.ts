/** URL catalog for the G3 visual pack. The UI retains CSS fallbacks until artwork is loaded. */
const root = `${import.meta.env.BASE_URL}interfaz/g3/`;

export const G3_UI_ASSETS = {
  gateLeft: root + 'ui_puertas_reales_izquierda_v01.webp',
  gateRight: root + 'ui_puertas_reales_derecha_v01.webp',
  playerFrame: root + 'ui_presentacion_jugador_rojo_v01.webp',
  rivalFrame: root + 'ui_presentacion_rival_azul_v01.webp',
  menuButton: root + 'ui_boton_menu_base_v01.webp',
  menuButtonPressed: root + 'ui_boton_menu_pulsado_v01.webp',
  smallButton: root + 'ui_boton_accion_base_v01.webp',
  victoryCartela: root + 'ui_victoria_cartela_v01.webp',
  defeatCartela: root + 'ui_derrota_cartela_v01.webp',
  resultSeal: root + 'ui_sello_resultado_v01.webp',
} as const;
