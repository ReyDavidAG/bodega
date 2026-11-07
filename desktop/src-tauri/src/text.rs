use std::time::{SystemTime, UNIX_EPOCH};

const GB: f64 = 1024.0 * 1024.0 * 1024.0;

pub fn gb(bytes: u64) -> String {
    let n = bytes as f64;
    if n >= 10.0 * GB {
        format!("{} GB", (n / GB).round())
    } else if n >= GB {
        format!("{:.1} GB", n / GB)
    } else {
        format!("{} MB", (n / 1024.0 / 1024.0).round().max(1.0))
    }
}

fn days_from_civil(y: i64, m: i64, d: i64) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let doy = (153 * ((m + 9) % 12) + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146_097 + doe - 719_468
}

pub fn parse_iso_ms(s: &str) -> Option<i64> {
    let num = |a: usize, b: usize| s.get(a..b)?.parse::<i64>().ok();
    if s.len() < 20 || !s.ends_with('Z') || s.get(10..11) != Some("T") {
        return None;
    }
    let days = days_from_civil(num(0, 4)?, num(5, 7)?, num(8, 10)?);
    let secs = days * 86_400 + num(11, 13)? * 3600 + num(14, 16)? * 60 + num(17, 19)?;
    let millis = match s.get(19..20) {
        Some(".") => num(20, 23).unwrap_or(0),
        _ => 0,
    };
    Some(secs * 1000 + millis)
}

pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

pub fn ago(iso: &str, now: i64) -> Option<String> {
    let minutes = (now - parse_iso_ms(iso)?).max(0) / 60_000;
    Some(match minutes {
        0 => "hace un momento".into(),
        1..=59 => format!("hace {minutes} min"),
        60..=1439 => format!("hace {} h", minutes / 60),
        _ => format!("hace {} d", minutes / 1440),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formatea_como_la_cli() {
        assert_eq!(gb(122_023_088_128), "114 GB");
        assert_eq!(gb(8_701_235_200), "8.1 GB");
        assert_eq!(gb(5 * 1024 * 1024), "5 MB");
        assert_eq!(gb(10), "1 MB");
    }

    #[test]
    fn lee_fechas_iso_del_motor() {
        assert_eq!(parse_iso_ms("1970-01-01T00:00:00.000Z"), Some(0));
        assert_eq!(
            parse_iso_ms("2026-11-06T21:06:14.797Z"),
            Some(1_793_999_174_797)
        );
        assert_eq!(
            parse_iso_ms("2024-02-29T12:00:00Z"),
            Some(1_709_208_000_000)
        );
        assert_eq!(parse_iso_ms("ayer"), None);
    }

    #[test]
    fn dice_hace_cuanto() {
        let t = parse_iso_ms("2026-11-06T21:00:00.000Z").unwrap();
        let at = |m: i64| ago("2026-11-06T21:00:00.000Z", t + m * 60_000).unwrap();
        assert_eq!(at(0), "hace un momento");
        assert_eq!(at(5), "hace 5 min");
        assert_eq!(at(125), "hace 2 h");
        assert_eq!(at(3 * 1440), "hace 3 d");
    }
}
