use tauri::{WebviewUrl, WebviewWindowBuilder};

const DASHBOARD: &str = "http://127.0.0.1:2633/";

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let url = DASHBOARD.parse().expect("dashboard url");
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("Bodega")
                .inner_size(1280.0, 820.0)
                .min_inner_size(960.0, 600.0)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Bodega");
}
