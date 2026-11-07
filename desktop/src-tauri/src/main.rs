mod engine;
mod nav;

use tauri::async_runtime::spawn_blocking;
use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![engine_status, start_engine])
        .setup(|app| {
            open_window(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Bodega");
}
