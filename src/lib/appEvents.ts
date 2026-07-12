import { emit, listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type { Character } from "../pages/character/character-editor";
import type { Scene } from "../components/game/SceneEditor";
import type { Campaign } from "../components/campaign/CampaignSelector";

// Cross-window messaging so windows opened via openChildWindow (e.g. the
// toolbox window) can drive the play canvas living in the main window.

const SCENE_SELECT_REQUEST = "app://scene-select-request";
const ACTIVE_SCENE_CHANGED = "app://active-scene-changed";
const CHARACTER_SELECT_REQUEST = "app://character-select-request";
const CAMPAIGN_UPDATED = "app://campaign-updated";
const SCENE_UPDATED = "app://scene-updated";

// `disabledCells` is a Set, which doesn't survive JSON serialization across
// the Tauri event bus, so scenes travel as plain arrays over the wire.
type SerializedScene = Omit<Scene, "disabledCells"> & { disabledCells: string[] };

function serializeScene(scene: Scene): SerializedScene {
  return { ...scene, disabledCells: [...scene.disabledCells] };
}

function deserializeScene(scene: SerializedScene): Scene {
  return { ...scene, disabledCells: new Set(scene.disabledCells) };
}

// Ask the window that owns the play canvas to switch its active scene.
// The full scene is sent along so the receiver can apply it directly,
// without a round trip back to disk.
export function requestSceneSelect(scene: Scene) {
  emit(SCENE_SELECT_REQUEST, serializeScene(scene));
}

export function onSceneSelectRequest(handler: (scene: Scene) => void): Promise<UnlistenFn> {
  return listen<SerializedScene>(SCENE_SELECT_REQUEST, (e) => handler(deserializeScene(e.payload)));
}

// Broadcast by the play canvas owner whenever the active scene changes, so
// other windows (e.g. the toolbox map tab) can highlight it.
export function broadcastActiveScene(sceneId: string | null) {
  emit(ACTIVE_SCENE_CHANGED, { sceneId });
}

export function onActiveSceneChanged(handler: (sceneId: string | null) => void): Promise<UnlistenFn> {
  return listen<{ sceneId: string | null }>(ACTIVE_SCENE_CHANGED, (e) => handler(e.payload.sceneId));
}

// Ask the window that owns the play canvas to drop a token for this character.
export function requestCharacterSelect(character: Character) {
  emit(CHARACTER_SELECT_REQUEST, character);
}

export function onCharacterSelectRequest(handler: (character: Character) => void): Promise<UnlistenFn> {
  return listen<Character>(CHARACTER_SELECT_REQUEST, (e) => handler(e.payload));
}

// Broadcast whenever campaign data (scenes, scene map, etc.) is saved from any
// window. The full campaign rides along so listeners can apply it directly,
// without a round trip back to disk.
export function broadcastCampaignUpdated(campaign: Campaign) {
  emit(CAMPAIGN_UPDATED, campaign);
}

export function onCampaignUpdated(handler: (campaign: Campaign) => void): Promise<UnlistenFn> {
  return listen<Campaign>(CAMPAIGN_UPDATED, (e) => handler(e.payload));
}

// Broadcast whenever a scene's own data (grid type, size, background, etc.)
// is saved, so windows currently displaying that scene can reload it. The
// full scene rides along so listeners can apply it without hitting disk.
export function broadcastSceneUpdated(scene: Scene) {
  emit(SCENE_UPDATED, serializeScene(scene));
}

export function onSceneUpdated(handler: (scene: Scene) => void): Promise<UnlistenFn> {
  return listen<SerializedScene>(SCENE_UPDATED, (e) => handler(deserializeScene(e.payload)));
}
