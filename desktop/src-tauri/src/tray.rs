use std::process::Command;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::Sender;
use std::thread;

use tauri::image::Image;
use tauri::menu::{CheckMenuItem, Menu, MenuEvent, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_autostart::ManagerExt;

use crate::engine::{self, Summary};
use crate::{nav, text};

pub struct Tray {
    free: MenuItem<Wry>,
    scanned: MenuItem<Wry>,
    scan: MenuItem<Wry>,
    login: CheckMenuItem<Wry>,
}

pub struct Scanning(pub AtomicBool);

pub struct Refresh(pub Mutex<Sender<()>>);

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let free = MenuItem::with_id(app, "free", "Consultando el disco…", false, None::<&str>)?;
    let scanned = MenuItem::with_id(app, "scanned", "Sin escanear", false, None::<&str>)?;
    let open = MenuItem::with_id(app, "open", "Abrir Bodega", true, None::<&str>)?;
    let scan = MenuItem::with_id(app, "scan", "Escanear ahora", true, None::<&str>)?;
    let browser = MenuItem::with_id(app, "browser", "Abrir en el navegador", true, None::<&str>)?;
    let login = CheckMenuItem::with_id(
        app,
        "login",
        "Iniciar con la sesión",
        true,
        app.autolaunch().is_enabled().unwrap_or(false),
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "quit", "Salir de Bodega", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &free,
            &scanned,
            &PredefinedMenuItem::separator(app)?,
            &open,
            &scan,
            &browser,
            &PredefinedMenuItem::separator(app)?,
            &login,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )?;
    TrayIconBuilder::with_id("bodega")
        .icon(Image::from_bytes(include_bytes!("../icons/tray.png"))?)
        .icon_as_template(true)
        .tooltip("Bodega")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(on_menu)
        .build(app)?;
    app.manage(Tray {
        free,
        scanned,
        scan,
        login,
    });
    app.manage(Scanning(AtomicBool::new(false)));
    Ok(())
}

fn on_menu(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
        "open" => crate::show_window(app),
        "scan" => start_scan(app),
        "browser" => {
            let _ = Command::new("/usr/bin/open")
                .arg(nav::dashboard().as_str())
                .spawn();
        }
        "login" => toggle_login(app),
        "quit" => app.exit(0),
        _ => {}
    }
}

fn toggle_login(app: &AppHandle) {
    let launcher = app.autolaunch();
    let enabled = launcher.is_enabled().unwrap_or(false);
    let _ = if enabled {
        launcher.disable()
    } else {
        launcher.enable()
    };
    let _ = app
        .state::<Tray>()
        .login
        .set_checked(launcher.is_enabled().unwrap_or(false));
}

pub fn free_line(summary: &Summary) -> String {
    match summary.internal() {
        Some(d) => format!("{} libres en {}", text::gb(d.free), d.name),
        None => "Sin datos del disco".into(),
    }
}

pub fn scanned_line(summary: &Summary, now: i64) -> String {
    summary
        .scanned_at
        .as_deref()
        .and_then(|at| text::ago(at, now))
        .map(|ago| format!("Último escaneo: {ago}"))
        .unwrap_or_else(|| "Sin escanear".into())
}

pub fn update(app: &AppHandle, summary: &Result<Summary, String>) {
    let tray = app.state::<Tray>();
    let busy = app.state::<Scanning>().0.load(Ordering::SeqCst);
    match summary {
        Ok(s) => {
            let _ = tray.free.set_text(free_line(s));
            let _ = tray.scanned.set_text(scanned_line(s, text::now_ms()));
            let scanning = busy || s.scanning;
            let _ = tray.scan.set_text(if scanning {
                "Escaneando…"
            } else {
                "Escanear ahora"
            });
            let _ = tray.scan.set_enabled(!scanning);
        }
        Err(_) => {
            let _ = tray.free.set_text("El motor no está corriendo");
            let _ = tray.scanned.set_text("Abre Bodega para arrancarlo");
            let _ = tray.scan.set_enabled(false);
        }
    }
}

pub fn refresh(app: &AppHandle) {
    if let Ok(tx) = app.state::<Refresh>().0.lock() {
        let _ = tx.send(());
    }
}

fn start_scan(app: &AppHandle) {
    if app.state::<Scanning>().0.swap(true, Ordering::SeqCst) {
        return;
    }
    let tray = app.state::<Tray>();
    let _ = tray.scan.set_text("Escaneando…");
    let _ = tray.scan.set_enabled(false);
    let app = app.clone();
    thread::spawn(move || {
        let result = engine::scan();
        app.state::<Scanning>().0.store(false, Ordering::SeqCst);
        crate::alerts::scan_finished(&app, result);
        refresh(&app);
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::Disk;

    fn summary(scanned_at: Option<&str>) -> Summary {
        Summary {
            disks: vec![Disk {
                name: "Macintosh HD".into(),
                mount: "/System/Volumes/Data".into(),
                free: 122_023_088_128,
                size: 494_384_795_648,
                internal: true,
            }],
            scanned_at: scanned_at.map(Into::into),
            scanning: false,
            reclaimable: 0,
            alert_free_gb: 20,
            low: false,
        }
    }

    #[test]
    fn muestra_el_espacio_del_disco_interno() {
        assert_eq!(free_line(&summary(None)), "114 GB libres en Macintosh HD");
    }

    #[test]
    fn muestra_cuando_fue_el_ultimo_escaneo() {
        let at = "2026-11-06T21:00:00.000Z";
        let now = text::parse_iso_ms(at).unwrap() + 2 * 3_600_000;
        assert_eq!(
            scanned_line(&summary(Some(at)), now),
            "Último escaneo: hace 2 h"
        );
        assert_eq!(scanned_line(&summary(None), now), "Sin escanear");
    }
}
