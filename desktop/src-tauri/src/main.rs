mod alerts;
mod engine;
mod nav;
mod text;
mod tray;

use std::sync::Mutex;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use tauri::async_runtime::spawn_blocking;
use tauri::webview::NewWindowResponse;
use tauri::{ActivationPolicy, RunEvent, WindowEvent};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

#[tauri::command]
async fn engine_status(window: WebviewWindow) -> bool {
    let up = spawn_blocking(engine::alive).await.unwrap_or(false);
    if up {
        let _ = window.navigate(nav::dashboard());
    }
    up
}

#[tauri::command]
async fn start_engine() -> Result<(), String> {
    spawn_blocking(engine::start)
        .await
        .map_err(|e| e.to_string())?
}

fn open_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    if let Some(window) = app.get_webview_window("main") {
        return Ok(window);
    }
    let url = if engine::alive() {
        WebviewUrl::External(nav::dashboard())
    } else {
        WebviewUrl::App("index.html".into())
    };
    WebviewWindowBuilder::new(app, "main", url)
        .title("Bodega")
        .inner_size(1280.0, 820.0)
        .min_inner_size(960.0, 600.0)
        .on_navigation(nav::guard)
        .on_new_window(|url, _| {
            nav::guard(&url);
            NewWindowResponse::Deny
        })
        .on_page_load(|_, payload| {
            #[cfg(debug_assertions)]
            eprintln!("[bodega] {:?} {}", payload.event(), payload.url());
            let _ = payload;
        })
        .build()
}

const LAUNCHER: &str = "com.reydavidag.bodega.launcher";
const HIDDEN: &str = "--hidden";

fn state_flags() -> StateFlags {
    StateFlags::all() & !StateFlags::VISIBLE
}

pub fn show_window(app: &AppHandle) {
    let _ = app.set_activation_policy(ActivationPolicy::Regular);
    let _ = app.show();
    if let Ok(window) = open_window(app) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn watch(app: AppHandle, rx: mpsc::Receiver<()>) {
    thread::spawn(move || {
        loop {
            let summary = engine::summary();
            tray::update(&app, &summary);
            if let Ok(summary) = &summary {
                alerts::check(&app, summary);
            }
            let _ = rx.recv_timeout(Duration::from_secs(60));
            while rx.try_recv().is_ok() {}
        }
    });
}

fn hide_window(window: &tauri::Window) {
    let app = window.app_handle();
    let _ = app.save_window_state(state_flags());
    let _ = window.hide();
    let _ = app.set_activation_policy(ActivationPolicy::Accessory);
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(state_flags())
                .build(),
        )
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .app_name(LAUNCHER)
                .arg(HIDDEN)
                .build(),
        )
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                hide_window(window);
            }
        })
        .invoke_handler(tauri::generate_handler![engine_status, start_engine])
        .setup(|app| {
            let (tx, rx) = mpsc::channel();
            app.manage(tray::Refresh(Mutex::new(tx)));
            app.manage(alerts::Alerts(Mutex::new(alerts::LowDisk::default())));
            tray::build(app.handle())?;
            if std::env::args().any(|a| a == HIDDEN) {
                app.set_activation_policy(ActivationPolicy::Accessory);
            } else {
                show_window(app.handle());
            }
            watch(app.handle().clone(), rx);
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Bodega");
    app.run(|app, event| {
        if let RunEvent::Reopen { .. } = event {
            show_window(app);
        }
    });
}
