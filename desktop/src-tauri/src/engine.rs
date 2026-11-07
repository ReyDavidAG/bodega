use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use serde::Deserialize;

use crate::nav;

const LABEL: &str = "dev.bodega.agent";
pub const NOT_INSTALLED: &str = "not-installed";

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Disk {
    pub name: String,
    pub mount: String,
    pub free: u64,
    pub size: u64,
    pub internal: bool,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub disks: Vec<Disk>,
    pub scanned_at: Option<String>,
    pub scanning: bool,
    pub reclaimable: u64,
    #[serde(rename = "alertFreeGB")]
    pub alert_free_gb: u64,
    pub low: bool,
}

impl Summary {
    pub fn internal(&self) -> Option<&Disk> {
        self.disks.iter().find(|d| d.internal)
    }
}

fn home() -> PathBuf {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_default()
}

pub fn state_dir() -> PathBuf {
    std::env::var_os("BODEGA_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| home().join(".bodega"))
}

pub fn read_token(dir: &Path) -> Result<String, String> {
    let raw = fs::read_to_string(dir.join("token"))
        .map_err(|_| "Falta el token de Bodega en ~/.bodega/token".to_string())?;
    let token = raw.trim();
    if token.len() < 32 || !token.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err("El token de Bodega no es válido".into());
    }
    Ok(token.to_string())
}

fn client(timeout: Duration) -> ureq::Agent {
    ureq::Agent::new_with_config(
        ureq::Agent::config_builder()
            .timeout_global(Some(timeout))
            .proxy(None)
            .build(),
    )
}

fn api(path: &str) -> String {
    format!("{}api/{path}", nav::dashboard())
}

pub fn alive() -> bool {
    let Ok(token) = read_token(&state_dir()) else {
        return false;
    };
    client(Duration::from_secs(2))
        .get(api("summary"))
        .header("x-bodega-token", &token)
        .call()
        .is_ok()
}

pub fn summary() -> Result<Summary, String> {
    let token = read_token(&state_dir())?;
    client(Duration::from_secs(3))
        .get(api("summary"))
        .header("x-bodega-token", &token)
        .call()
        .map_err(|e| e.to_string())?
        .body_mut()
        .read_json::<Summary>()
        .map_err(|e| e.to_string())
}

pub fn scan() -> Result<(), String> {
    let token = read_token(&state_dir())?;
    let body = client(Duration::from_secs(30 * 60))
        .post(api("scan"))
        .header("x-bodega-token", &token)
        .send_empty()
        .map_err(|e| e.to_string())?
        .body_mut()
        .read_to_string()
        .map_err(|e| e.to_string())?;
    scan_result(&body)
}

pub fn scan_result(body: &str) -> Result<(), String> {
    for line in body.lines().rev() {
        let Ok(event) = serde_json::from_str::<serde_json::Value>(line) else {
            continue;
        };
        return match event["type"].as_str() {
            Some("end") => Ok(()),
            Some("error") => Err(event["message"].as_str().unwrap_or("Error").into()),
            _ => continue,
        };
    }
    Err("El escaneo no terminó".into())
}

pub fn agent_plist() -> PathBuf {
    home()
        .join("Library/LaunchAgents")
        .join(format!("{LABEL}.plist"))
}

fn launchctl(args: &[&str]) -> bool {
    Command::new("/bin/launchctl")
        .args(args)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn start() -> Result<(), String> {
    let plist = agent_plist();
    if !plist.exists() {
        return Err(NOT_INSTALLED.into());
    }
    let domain = format!("gui/{}", unsafe { libc::getuid() });
    let service = format!("{domain}/{LABEL}");
    if launchctl(&["kickstart", &service])
        || launchctl(&["bootstrap", &domain, &plist.to_string_lossy()])
    {
        return Ok(());
    }
    Err("launchctl no pudo arrancar el motor".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dir_with(token: Option<&str>) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "bodega-token-{}-{}",
            std::process::id(),
            token.map(|t| t.len()).unwrap_or(0)
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        if let Some(t) = token {
            fs::write(dir.join("token"), t).unwrap();
        }
        dir
    }

    #[test]
    fn lee_el_token_y_quita_espacios() {
        let token = "a".repeat(48);
        let dir = dir_with(Some(&format!("{token}\n")));
        assert_eq!(read_token(&dir).unwrap(), token);
    }

    #[test]
    fn falla_sin_token_o_con_token_invalido() {
        assert!(read_token(&dir_with(None)).is_err());
        assert!(read_token(&dir_with(Some("   "))).is_err());
        assert!(
            read_token(&dir_with(Some(
                "zz<script>zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
            )))
            .is_err()
        );
    }

    #[test]
    fn interpreta_el_resumen_del_motor() {
        let json = r#"{"disks":[{"name":"Macintosh HD","mount":"/System/Volumes/Data","free":122023088128,"size":494384795648,"internal":true},{"name":"KINGSTON","mount":"/Volumes/KINGSTON","free":1,"size":2,"internal":false}],"scannedAt":"2026-11-06T21:06:14.797Z","scanning":false,"reclaimable":8701235200,"alertFreeGB":20,"low":false}"#;
        let s: Summary = serde_json::from_str(json).unwrap();
        assert_eq!(s.internal().unwrap().name, "Macintosh HD");
        assert_eq!(s.alert_free_gb, 20);
        assert_eq!(s.scanned_at.as_deref(), Some("2026-11-06T21:06:14.797Z"));
    }

    #[test]
    fn el_escaneo_termina_con_end_o_con_error() {
        assert!(scan_result("{\"type\":\"progress\"}\n{\"type\":\"end\"}\n").is_ok());
        assert_eq!(
            scan_result("{\"type\":\"error\",\"message\":\"sin permiso\"}\n").unwrap_err(),
            "sin permiso"
        );
        assert!(scan_result("{\"type\":\"progress\"}\n").is_err());
    }
}
