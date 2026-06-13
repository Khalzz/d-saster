use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SceneData {
    id: String,
    name: String,
    grid_type: String,
    cols: u32,
    rows: u32,
    disabled_cells: Vec<String>,
    bg: Option<String>,
    bg_bounds: Option<BgBounds>,
    cell_size: Option<u32>,
    last_edited: Option<String>,
    last_editor: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct BgBounds {
    w: f64,
    h: f64,
}

fn scenes_dir() -> Result<PathBuf, String> {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or("could not resolve project root")?
        .to_path_buf();
    Ok(root.join("data").join("scenes"))
}

#[tauri::command]
fn save_scene(scene: SceneData) -> Result<(), String> {
    let dir = scenes_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.json", scene.id));
    let json = serde_json::to_string_pretty(&scene).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_scenes() -> Result<Vec<SceneData>, String> {
    let dir = scenes_dir()?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut scenes = vec![];
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        match serde_json::from_str::<SceneData>(&content) {
            Ok(scene) => scenes.push(scene),
            Err(_) => continue,
        }
    }
    Ok(scenes)
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SceneNodeConnections {
    top: Option<String>,
    right: Option<String>,
    bottom: Option<String>,
    left: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
struct SceneNode {
    id: String,
    x: f64,
    y: f64,
    connections: SceneNodeConnections,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SceneToken {
    id: String,
    character_id: String,
    name: String,
    image: Option<String>,
    col: i32,
    row: i32,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CampaignData {
    id: String,
    title: String,
    description: String,
    tags: Vec<String>,
    color: String,
    image: Option<String>,
    scenes: Option<Vec<String>>,
    scene_map: Option<Vec<SceneNode>>,
    #[serde(default)]
    last_active_scene: Option<String>,
    #[serde(default)]
    scene_tokens: Option<HashMap<String, Vec<SceneToken>>>,
}

fn campaigns_dir() -> Result<PathBuf, String> {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or("could not resolve project root")?
        .to_path_buf();
    Ok(root.join("data").join("campaigns"))
}

#[tauri::command]
fn save_campaign(campaign: CampaignData) -> Result<(), String> {
    let dir = campaigns_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.json", campaign.id));
    let json = serde_json::to_string_pretty(&campaign).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_campaigns() -> Result<Vec<CampaignData>, String> {
    let dir = campaigns_dir()?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut campaigns = vec![];
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        match serde_json::from_str::<CampaignData>(&content) {
            Ok(c) => campaigns.push(c),
            Err(_) => continue,
        }
    }
    Ok(campaigns)
}

#[tauri::command]
fn delete_scene(id: String) -> Result<(), String> {
    let path = scenes_dir()?.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn delete_campaign(id: String) -> Result<(), String> {
    let path = campaigns_dir()?.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CharacterData {
    id: String,
    name: String,
    description: String,
    origin: String,
    race: String,
    class_id: Option<String>,
    ruleset_id: Option<String>,
    image: Option<String>,
    #[serde(rename = "type")]
    character_type: String,
    stats: HashMap<String, i32>,
    #[serde(default)]
    saving_throws: HashMap<String, i32>,
    #[serde(default)]
    skill_proficiencies: HashMap<String, bool>,
    #[serde(default)]
    inspiration: i32,
    #[serde(default)]
    proficiency_bonus: i32,
    #[serde(default = "default_level")]
    level: i32,
    #[serde(default = "default_armor_class")]
    armor_class: i32,
    #[serde(default)]
    initiative: i32,
    #[serde(default = "default_speed")]
    speed: i32,
}

fn default_level() -> i32 { 1 }
fn default_armor_class() -> i32 { 10 }
fn default_speed() -> i32 { 30 }

#[derive(Serialize, Deserialize)]
struct ClassModifier {
    name: String,
    value: i32,
}

#[derive(Serialize, Deserialize)]
struct CharacterClassData {
    id: String,
    name: String,
    modifiers: Vec<ClassModifier>,
}

fn classes_dir() -> Result<PathBuf, String> {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or("could not resolve project root")?
        .to_path_buf();
    Ok(root.join("data").join("classes"))
}

#[tauri::command]
fn save_class(class: CharacterClassData) -> Result<(), String> {
    let dir = classes_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.json", class.id));
    let json = serde_json::to_string_pretty(&class).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_classes() -> Result<Vec<CharacterClassData>, String> {
    let dir = classes_dir()?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut classes = vec![];
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        match serde_json::from_str::<CharacterClassData>(&content) {
            Ok(c) => classes.push(c),
            Err(_) => continue,
        }
    }
    Ok(classes)
}

#[tauri::command]
fn delete_class(id: String) -> Result<(), String> {
    let path = classes_dir()?.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn characters_dir() -> Result<PathBuf, String> {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or("could not resolve project root")?
        .to_path_buf();
    Ok(root.join("data").join("characters"))
}

#[tauri::command]
fn save_character(character: CharacterData) -> Result<(), String> {
    let dir = characters_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.json", character.id));
    let json = serde_json::to_string_pretty(&character).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_characters() -> Result<Vec<CharacterData>, String> {
    let dir = characters_dir()?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut characters = vec![];
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        match serde_json::from_str::<CharacterData>(&content) {
            Ok(c) => characters.push(c),
            Err(_) => continue,
        }
    }
    Ok(characters)
}

#[tauri::command]
fn delete_character(id: String) -> Result<(), String> {
    let path = characters_dir()?.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[derive(Serialize, Deserialize)]
struct StatDefinition {
    key: String,
    label: String,
    #[serde(default)]
    description: String,
}

#[derive(Serialize, Deserialize)]
struct RulesetClassModifier {
    name: String,
    value: i32,
}

#[derive(Serialize, Deserialize, Default)]
struct RulesetSkillProficiencies {
    count: u32,
    options: Vec<String>,
}

#[derive(Serialize, Deserialize, Default)]
struct RulesetClassLevelFeature {
    level: u32,
    #[serde(default, rename = "traitIds")]
    trait_ids: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct RulesetClass {
    id: String,
    name: String,
    #[serde(default)]
    description: String,
    modifiers: Vec<RulesetClassModifier>,
    #[serde(default, rename = "primaryAbility")]
    primary_ability: String,
    #[serde(default, rename = "hitDie")]
    hit_die: String,
    #[serde(default, rename = "savingThrowProficiencies")]
    saving_throw_proficiencies: Vec<String>,
    #[serde(default, rename = "skillProficiencies")]
    skill_proficiencies: RulesetSkillProficiencies,
    #[serde(default, rename = "levelFeatures")]
    level_features: Vec<RulesetClassLevelFeature>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RulesetSkill {
    id: String,
    name: String,
    stat_key: String,
    #[serde(default)]
    description: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RulesetData {
    id: String,
    name: String,
    description: String,
    #[serde(default)]
    modifier_formula: String,
    #[serde(default)]
    skill_formula: String,
    #[serde(default)]
    saving_throw_formula: String,
    #[serde(default)]
    max_level: u32,
    stats: Vec<StatDefinition>,
    classes: Vec<RulesetClass>,
    #[serde(default)]
    skills: Vec<RulesetSkill>,
    #[serde(default)]
    traits: Vec<serde_json::Value>,
    #[serde(default)]
    species: Vec<serde_json::Value>,
    #[serde(default, alias = "terms")]
    rules: Vec<serde_json::Value>,
    #[serde(default)]
    rule_categories: Vec<String>,
}

fn rulesets_dir() -> Result<PathBuf, String> {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or("could not resolve project root")?
        .to_path_buf();
    Ok(root.join("data").join("rulesets"))
}

#[tauri::command]
fn save_ruleset(ruleset: RulesetData) -> Result<(), String> {
    let dir = rulesets_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.json", ruleset.id));
    let json = serde_json::to_string_pretty(&ruleset).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_rulesets() -> Result<Vec<RulesetData>, String> {
    let dir = rulesets_dir()?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut rulesets = vec![];
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        match serde_json::from_str::<RulesetData>(&content) {
            Ok(r) => rulesets.push(r),
            Err(_) => continue,
        }
    }
    Ok(rulesets)
}

#[tauri::command]
fn delete_ruleset(id: String) -> Result<(), String> {
    let path = rulesets_dir()?.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ── Sheets ─────────────────────────────────────────────────────────────────

fn sheets_dir() -> Result<PathBuf, String> {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or("could not resolve project root")?
        .to_path_buf();
    Ok(root.join("data").join("sheets"))
}

#[tauri::command]
fn save_sheet(id: String, data: serde_json::Value) -> Result<(), String> {
    let dir = sheets_dir()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{}.json", id));
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_sheet(id: String) -> Result<Option<serde_json::Value>, String> {
    let path = sheets_dir()?.join(format!("{}.json", id));
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(value))
}

#[tauri::command]
fn list_sheets() -> Result<Vec<serde_json::Value>, String> {
    let dir = sheets_dir()?;
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut sheets = vec![];
    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let path = entry.map_err(|e| e.to_string())?.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        match serde_json::from_str::<serde_json::Value>(&content) {
            Ok(v) => sheets.push(v),
            Err(_) => continue,
        }
    }
    Ok(sheets)
}

#[tauri::command]
fn delete_sheet(id: String) -> Result<(), String> {
    let path = sheets_dir()?.join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_scene, list_scenes, delete_scene,
            save_campaign, list_campaigns, delete_campaign,
            save_character, list_characters, delete_character,
            save_class, list_classes, delete_class,
            save_ruleset, list_rulesets, delete_ruleset,
            save_sheet, load_sheet, list_sheets, delete_sheet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
