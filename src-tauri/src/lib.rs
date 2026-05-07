use serde::{Deserialize, Serialize};
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![save_scene, list_scenes, delete_scene, save_campaign, list_campaigns, delete_campaign])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
