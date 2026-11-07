mod nav;

use tauri::webview::NewWindowResponse;
use tauri::{WebviewUrl, WebviewWindowBuilder};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(nav::dashboard()))
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
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Bodega");
}
