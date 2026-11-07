use std::sync::Mutex;

use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::engine::{self, Summary};
use crate::text;

const GB: u64 = 1024 * 1024 * 1024;
const HYSTERESIS_GB: u64 = 5;

#[derive(Default)]
pub struct LowDisk {
    notified: bool,
}

impl LowDisk {
    pub fn should_notify(&mut self, free: u64, threshold_gb: u64) -> bool {
        if threshold_gb == 0 {
            self.notified = false;
            return false;
        }
        if free < threshold_gb * GB {
            let first = !self.notified;
            self.notified = true;
            return first;
        }
        if free >= (threshold_gb + HYSTERESIS_GB) * GB {
            self.notified = false;
        }
        false
    }
}

pub struct Alerts(pub Mutex<LowDisk>);

fn notify(app: &AppHandle, title: &str, body: &str) {
    let _ = app.notification().builder().title(title).body(body).show();
}

fn reclaimable_line(reclaimable: u64) -> String {
    if reclaimable > 0 {
        format!(
            "{} se pueden recuperar sin perder nada. Abre Bodega › Limpieza.",
            text::gb(reclaimable)
        )
    } else {
        "Abre Bodega para ver qué ocupa el disco.".into()
    }
}

pub fn check(app: &AppHandle, summary: &Summary) {
    let Some(disk) = summary.internal() else {
        return;
    };
    let fire = app
        .state::<Alerts>()
        .0
        .lock()
        .map(|mut low| low.should_notify(disk.free, summary.alert_free_gb))
        .unwrap_or(false);
    if fire {
        notify(
            app,
            &format!("Quedan {} libres en {}", text::gb(disk.free), disk.name),
            &reclaimable_line(summary.reclaimable),
        );
    }
}

pub fn scan_finished(app: &AppHandle, result: Result<(), String>) {
    let visible = app
        .get_webview_window("main")
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false);
    if visible {
        return;
    }
    match result {
        Ok(()) => {
            let reclaimable = engine::summary().map(|s| s.reclaimable).unwrap_or(0);
            notify(app, "Escaneo terminado", &reclaimable_line(reclaimable));
        }
        Err(error) => notify(app, "El escaneo no terminó", &error),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn avisa_una_vez_al_cruzar_el_umbral() {
        let mut low = LowDisk::default();
        assert!(!low.should_notify(30 * GB, 20));
        assert!(low.should_notify(19 * GB, 20));
        assert!(!low.should_notify(18 * GB, 20));
        assert!(!low.should_notify(10 * GB, 20));
    }

    #[test]
    fn vuelve_a_avisar_solo_tras_recuperar_el_margen() {
        let mut low = LowDisk::default();
        assert!(low.should_notify(19 * GB, 20));
        assert!(!low.should_notify(22 * GB, 20));
        assert!(!low.should_notify(19 * GB, 20));
        assert!(!low.should_notify(25 * GB, 20));
        assert!(low.should_notify(19 * GB, 20));
    }

    #[test]
    fn cero_apaga_los_avisos() {
        let mut low = LowDisk::default();
        assert!(!low.should_notify(1, 0));
        assert!(low.should_notify(1, 20));
    }

    #[test]
    fn sugiere_limpiar_si_hay_algo_que_recuperar() {
        assert_eq!(
            reclaimable_line(8_701_235_200),
            "8.1 GB se pueden recuperar sin perder nada. Abre Bodega › Limpieza."
        );
        assert_eq!(
            reclaimable_line(0),
            "Abre Bodega para ver qué ocupa el disco."
        );
    }
}
